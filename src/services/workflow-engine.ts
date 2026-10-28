import {
  NodeExecutionLog,
  WebhookPayload,
  WebhookPayloadSchema,
  WorkflowConfig,
  WorkflowExecutionResult,
} from "@/types/workflow";
import { AIAgentService } from "./ai-agent-service";
import { FilterService } from "./filter-service";
import { StorageService } from "./storage-adapter";
import { NotificationService } from "./notification-service";

// In-memory request deduplication cache (5 minute TTL)
const requestDedupeCache = new Map<string, number>();

export class WorkflowExecutionEngine {
  private static deduplicate(payload: WebhookPayload): boolean {
    const key = `${payload.phone}_${payload.message.trim()}`;
    const now = Date.now();
    const lastSeen = requestDedupeCache.get(key);

    if (lastSeen && now - lastSeen < 300000) {
      // Duplicate detected within 5 minutes
      return true;
    }
    requestDedupeCache.set(key, now);
    return false;
  }

  /**
   * Run the end-to-end workflow:
   * Node 1: Webhook
   * Node 2: AI Agent (OpenAI Chat Model + Structured Output Parser)
   * Node 3: Filter
   * Node 4: Append row in sheet (Local CSV / Google Sheets)
   * Node 5: Send SMS/WhatsApp Notification
   */
  static async execute(
    rawPayload: unknown,
    config?: Partial<WorkflowConfig>
  ): Promise<WorkflowExecutionResult> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const startedAt = new Date().toISOString();
    const startTimestamp = Date.now();
    const logs: NodeExecutionLog[] = [];

    const mergedConfig: WorkflowConfig = {
      aiModel: {
        provider: "openai",
        model: config?.aiModel?.model || "gpt-4o",
        temperature: config?.aiModel?.temperature || 0.2,
      },
      filter: {
        field: config?.filter?.field || "budget_qualified",
        operator: config?.filter?.operator || "equals",
        value: config?.filter?.value !== undefined ? config?.filter?.value : true,
      },
      storage: {
        provider: config?.storage?.provider || "local_csv",
        targetFileOrSheet: config?.storage?.targetFileOrSheet || "leads_workflow_records.csv",
        spreadsheetId: config?.storage?.spreadsheetId,
        sheetName: config?.storage?.sheetName,
      },
      notification: {
        channel: config?.notification?.channel || "whatsapp",
        recipient: config?.notification?.recipient || "+919307512816",
        messageTemplate:
          config?.notification?.messageTemplate ||
          "Hello {{lead_name}}, your luxury consultation enquiry has been qualified.",
        dryRun: config?.notification?.dryRun !== undefined ? config?.notification?.dryRun : true,
      },
    };

    // -------------------------------------------------------------
    // NODE 1: Webhook Node
    // -------------------------------------------------------------
    const webhookStart = Date.now();
    const parsedPayload = WebhookPayloadSchema.safeParse(rawPayload);

    if (!parsedPayload.success) {
      const errLog: NodeExecutionLog = {
        nodeId: "node-webhook",
        nodeName: "Webhook",
        status: "error",
        startedAt: new Date(webhookStart).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - webhookStart,
        input: rawPayload,
        error: `Payload Validation Failed: ${JSON.stringify(parsedPayload.error.format())}`,
      };
      logs.push(errLog);

      return {
        executionId,
        workflowId: "wf-studio-olives-cre",
        status: "failed",
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startTimestamp,
        logs,
        error: "Webhook payload validation failed. Aborted workflow.",
      };
    }

    const payload = parsedPayload.data;

    // Check duplicate request
    if (this.deduplicate(payload)) {
      const dupLog: NodeExecutionLog = {
        nodeId: "node-webhook",
        nodeName: "Webhook",
        status: "error",
        startedAt: new Date(webhookStart).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - webhookStart,
        input: payload,
        error: `Duplicate Request Detected: Payload from ${payload.phone} was received within the last 5 minutes. Rejected to prevent duplicate records.`,
      };
      logs.push(dupLog);

      return {
        executionId,
        workflowId: "wf-studio-olives-cre",
        status: "failed",
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startTimestamp,
        logs,
        error: "Duplicate request detected.",
      };
    }

    logs.push({
      nodeId: "node-webhook",
      nodeName: "Webhook",
      status: "success",
      startedAt: new Date(webhookStart).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - webhookStart,
      input: rawPayload,
      output: payload,
    });

    // -------------------------------------------------------------
    // NODE 2: AI Agent Node (OpenAI Chat Model + Structured Output Parser)
    // -------------------------------------------------------------
    const aiStart = Date.now();
    const allowSimulation =
      mergedConfig.aiModel.provider === "mock_manual" ||
      (config as Record<string, unknown>)?.simulate === true;

    const aiRes = await AIAgentService.processLead(
      payload,
      mergedConfig.aiModel.model,
      allowSimulation
    );

    if (!aiRes.success || !aiRes.structuredOutput) {
      logs.push({
        nodeId: "node-ai-agent",
        nodeName: "AI Agent",
        status: "error",
        startedAt: new Date(aiStart).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - aiStart,
        input: payload,
        error: aiRes.error || "AI Agent failed to process inquiry.",
      });

      return {
        executionId,
        workflowId: "wf-studio-olives-cre",
        status: "failed",
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startTimestamp,
        logs,
        error: aiRes.error,
      };
    }

    const structuredAIOutput = aiRes.structuredOutput;

    logs.push({
      nodeId: "node-ai-agent",
      nodeName: "AI Agent",
      status: "success",
      startedAt: new Date(aiStart).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - aiStart,
      input: payload,
      output: structuredAIOutput,
    });

    // -------------------------------------------------------------
    // NODE 3: Filter Node
    // -------------------------------------------------------------
    const filterStart = Date.now();
    const filterRes = FilterService.evaluate(
      mergedConfig.filter,
      structuredAIOutput as unknown as Record<string, unknown>
    );

    if (!filterRes.passed) {
      logs.push({
        nodeId: "node-filter",
        nodeName: "Filter",
        status: "skipped",
        startedAt: new Date(filterStart).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - filterStart,
        input: structuredAIOutput,
        output: filterRes,
        warning: filterRes.reason,
      });

      // Mark downstream nodes as skipped
      logs.push({
        nodeId: "node-append-row",
        nodeName: "Append row in sheet",
        status: "skipped",
        startedAt: new Date().toISOString(),
        warning: "Skipped because previous Filter node rejected the item.",
      });

      logs.push({
        nodeId: "node-notification",
        nodeName: "Send SMS/WhatsApp Notification",
        status: "skipped",
        startedAt: new Date().toISOString(),
        warning: "Skipped because previous Filter node rejected the item.",
      });

      return {
        executionId,
        workflowId: "wf-studio-olives-cre",
        status: "partial",
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startTimestamp,
        logs,
        finalOutput: {
          filterStatus: "rejected",
          filterReason: filterRes.reason,
          aiOutput: structuredAIOutput,
        },
      };
    }

    logs.push({
      nodeId: "node-filter",
      nodeName: "Filter",
      status: "success",
      startedAt: new Date(filterStart).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - filterStart,
      input: structuredAIOutput,
      output: filterRes,
    });

    // -------------------------------------------------------------
    // NODE 4: Append row in sheet
    // -------------------------------------------------------------
    const storageStart = Date.now();
    const rowToAppend: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      lead_name: structuredAIOutput.lead_name,
      phone: structuredAIOutput.phone,
      email: structuredAIOutput.email || "",
      property_type: structuredAIOutput.property_type,
      project_scope: structuredAIOutput.project_scope,
      estimated_budget_cr: structuredAIOutput.estimated_budget_cr,
      budget_qualified: structuredAIOutput.budget_qualified,
      priority_level: structuredAIOutput.priority_level,
      aesthetic_style: structuredAIOutput.aesthetic_style,
      summary: structuredAIOutput.summary,
      recommended_action: structuredAIOutput.recommended_action,
    };

    const storageRes = await StorageService.appendRow(
      mergedConfig.storage.provider,
      mergedConfig.storage.targetFileOrSheet,
      rowToAppend,
      {
        spreadsheetId: mergedConfig.storage.spreadsheetId,
        sheetName: mergedConfig.storage.sheetName,
      }
    );

    if (!storageRes.success) {
      logs.push({
        nodeId: "node-append-row",
        nodeName: "Append row in sheet",
        status: "error",
        startedAt: new Date(storageStart).toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - storageStart,
        input: rowToAppend,
        error: storageRes.message,
      });

      // Stop downstream notification on required storage failure
      logs.push({
        nodeId: "node-notification",
        nodeName: "Send SMS/WhatsApp Notification",
        status: "skipped",
        startedAt: new Date().toISOString(),
        warning: "Skipped because Append Row node failed.",
      });

      return {
        executionId,
        workflowId: "wf-studio-olives-cre",
        status: "failed",
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - startTimestamp,
        logs,
        error: storageRes.message,
      };
    }

    logs.push({
      nodeId: "node-append-row",
      nodeName: "Append row in sheet",
      status: "success",
      startedAt: new Date(storageStart).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - storageStart,
      input: rowToAppend,
      output: storageRes,
    });

    // -------------------------------------------------------------
    // NODE 5: Notification Node (SMS / WhatsApp)
    // -------------------------------------------------------------
    const notificationStart = Date.now();
    const notificationText =
      structuredAIOutput.whatsapp_notification_text ||
      `Studio Olives Cre: Client ${structuredAIOutput.lead_name} (${structuredAIOutput.phone}) has been qualified for ₹${structuredAIOutput.estimated_budget_cr} Cr luxury project. Priority: ${structuredAIOutput.priority_level.toUpperCase()}.`;

    const notifyRes = await NotificationService.sendNotification({
      channel: mergedConfig.notification.channel,
      recipient: mergedConfig.notification.recipient || structuredAIOutput.phone,
      messageBody: notificationText,
      dryRun: mergedConfig.notification.dryRun,
    });

    logs.push({
      nodeId: "node-notification",
      nodeName: "Send an SMS/MMS/WhatsApp...",
      status: notifyRes.success ? "success" : "error",
      startedAt: new Date(notificationStart).toISOString(),
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - notificationStart,
      input: {
        recipient: mergedConfig.notification.recipient,
        text: notificationText,
      },
      output: notifyRes,
      isDryRun: notifyRes.isDryRun,
      error: notifyRes.success ? undefined : notifyRes.message,
    });

    return {
      executionId,
      workflowId: "wf-studio-olives-cre",
      status: notifyRes.success ? "success" : "partial",
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startTimestamp,
      logs,
      finalOutput: {
        structuredAIOutput,
        storageResult: storageRes,
        notificationResult: notifyRes,
      },
    };
  }
}
