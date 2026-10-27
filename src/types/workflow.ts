import { z } from "zod";

export type NodeExecutionStatus = "idle" | "running" | "success" | "error" | "skipped";

export interface NodeExecutionLog {
  nodeId: string;
  nodeName: string;
  status: NodeExecutionStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  input?: unknown;
  output?: unknown;
  error?: string;
  warning?: string;
  isDryRun?: boolean;
}

export interface WorkflowExecutionResult {
  executionId: string;
  workflowId: string;
  status: "success" | "partial" | "failed";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  logs: NodeExecutionLog[];
  finalOutput?: unknown;
  error?: string;
}

// 1. Webhook Payload Schema
export const WebhookPayloadSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(7, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().min(1, "Message or inquiry is required"),
  propertyType: z.string().optional(),
  budget: z.string().optional().or(z.number().transform(v => String(v))),
  timeline: z.string().optional(),
  channel: z.enum(["web", "crm", "call", "whatsapp"]).default("web"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;

// 2. Structured AI Output Schema
export const AIStructuredOutputSchema = z.object({
  lead_name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  property_type: z.string(),
  project_scope: z.string(),
  estimated_budget_cr: z.number().describe("Estimated budget in Crores INR (e.g. 5.5)"),
  budget_qualified: z.boolean().describe("Whether budget meets or exceeds the luxury threshold (₹5 Cr)"),
  priority_level: z.enum(["high", "medium", "low"]),
  aesthetic_style: z.string(),
  summary: z.string(),
  recommended_action: z.string(),
  whatsapp_notification_text: z.string().describe("Crisp, professional notification message for the concierge or client"),
});
export type AIStructuredOutput = z.infer<typeof AIStructuredOutputSchema>;

// 3. Filter Condition Schema
export const FilterConditionSchema = z.object({
  field: z.string().default("budget_qualified"), // e.g. "budget_qualified" or "estimated_budget_cr"
  operator: z.enum(["equals", "not_equals", "greater_than", "greater_than_or_equal", "less_than", "contains"]),
  value: z.any().default(true),
});
export type FilterCondition = z.infer<typeof FilterConditionSchema>;

// 4. Append Row Config
export const StorageProviderSchema = z.enum(["local_csv", "local_sqlite", "google_sheets"]);
export type StorageProvider = z.infer<typeof StorageProviderSchema>;

export const AppendRowConfigSchema = z.object({
  provider: StorageProviderSchema.default("local_csv"),
  targetFileOrSheet: z.string().default("leads_workflow_records.csv"),
  sheetName: z.string().optional(),
  spreadsheetId: z.string().optional(),
});
export type AppendRowConfig = z.infer<typeof AppendRowConfigSchema>;

// 5. Notification Config
export const NotificationChannelSchema = z.enum(["sms", "whatsapp"]);
export type NotificationChannel = z.infer<typeof NotificationChannelSchema>;

export const NotificationConfigSchema = z.object({
  channel: NotificationChannelSchema.default("whatsapp"),
  recipient: z.string().default("+919307512816"),
  messageTemplate: z.string().default("Hello {{lead_name}}, your luxury consultation enquiry has been qualified."),
  dryRun: z.boolean().default(true),
});
export type NotificationConfig = z.infer<typeof NotificationConfigSchema>;

// Workflow configuration
export interface WorkflowConfig {
  aiModel: {
    provider: "openai" | "openai_compatible" | "mock_manual";
    model: string;
    temperature: number;
    systemPrompt?: string;
  };
  filter: FilterCondition;
  storage: AppendRowConfig;
  notification: NotificationConfig;
}
