import { describe, it, expect, vi, beforeEach } from "vitest";
import { FilterService } from "../services/filter-service";
import { StorageService } from "../services/storage-adapter";
import { NotificationService } from "../services/notification-service";
import { AIAgentService } from "../services/ai-agent-service";
import { WorkflowExecutionEngine } from "../services/workflow-engine";

describe("Workflow Automation Test Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Structured Output Parser", () => {
    it("should correctly parse valid JSON with code blocks", () => {
      const raw = "```json\n" + JSON.stringify({
        lead_name: "Vikram Singhania",
        phone: "+919876543210",
        email: "vikram@example.com",
        property_type: "Penthouse",
        project_scope: "Turnkey Interiors",
        estimated_budget_cr: 8.5,
        budget_qualified: true,
        priority_level: "high",
        aesthetic_style: "Warm Natural Stone & Italian Marble",
        summary: "Luxury penthouse project in South Delhi.",
        recommended_action: "Schedule initial partner walkthrough.",
        whatsapp_notification_text: "Enquiry qualified for ₹8.5 Cr.",
      }) + "\n```";

      const res = AIAgentService.parseStructuredOutput(raw);
      expect(res.success).toBe(true);
      expect(res.data?.budget_qualified).toBe(true);
      expect(res.data?.estimated_budget_cr).toBe(8.5);
    });

    it("should reject malformed JSON without crashing", () => {
      const bad = "{ lead_name: 'broken', budget: ";
      const res = AIAgentService.parseStructuredOutput(bad);
      expect(res.success).toBe(false);
      expect(res.error).toContain("Structured output JSON parse error");
    });
  });

  describe("2. Filter Node Evaluation", () => {
    it("should allow matching records through", () => {
      const condition = {
        field: "budget_qualified",
        operator: "equals" as const,
        value: true,
      };

      const result = FilterService.evaluate(condition, { budget_qualified: true });
      expect(result.passed).toBe(true);
      expect(result.reason).toContain("Condition met");
    });

    it("should reject non-matching records and stop downstream", () => {
      const condition = {
        field: "budget_qualified",
        operator: "equals" as const,
        value: true,
      };

      const result = FilterService.evaluate(condition, { budget_qualified: false });
      expect(result.passed).toBe(false);
      expect(result.reason).toContain("Filtered out");
    });

    it("should evaluate numeric greater_than conditions", () => {
      const condition = {
        field: "estimated_budget_cr",
        operator: "greater_than_or_equal" as const,
        value: 5.0,
      };

      expect(FilterService.evaluate(condition, { estimated_budget_cr: 6.5 }).passed).toBe(true);
      expect(FilterService.evaluate(condition, { estimated_budget_cr: 3.0 }).passed).toBe(false);
    });
  });

  describe("3. Append Row Node Storage Adapter", () => {
    it("should append rows to local CSV file", () => {
      const res = StorageService.appendToLocalCsv("test_records.csv", {
        lead_name: "Rahul Verma",
        phone: "+919811223344",
        budget: "7 Cr",
      });

      expect(res.success).toBe(true);
      expect(res.providerUsed).toBe("local_csv");
      expect(res.isRealStorage).toBe(true);
    });

    it("should honestly reject Google Sheets if credentials are unconfigured without faking write", async () => {
      const res = await StorageService.appendRow("google_sheets", "sheet1", { name: "Test" }, { spreadsheetId: "123" });
      expect(res.success).toBe(false);
      expect(res.providerUsed).toBe("google_sheets");
      expect(res.isRealStorage).toBe(false);
      expect(res.message).toContain("Google Sheets integration requires");
    });
  });

  describe("4. Notification Node (Dry-Run vs Real Delivery)", () => {
    it("should clearly label dry-runs without claiming real delivery", async () => {
      const res = await NotificationService.sendNotification({
        channel: "whatsapp",
        recipient: "+919307512816",
        messageBody: "Testing dry-run message",
        dryRun: true,
      });

      expect(res.isDryRun).toBe(true);
      expect(res.status).toBe("dry_run_preview");
      expect(res.message).toContain("[DRY-RUN PREVIEW]");
    });
  });

  describe("5. End-to-End Workflow Execution Engine", () => {
    it("should reject invalid webhook payloads at Node 1", async () => {
      const badPayload = { name: "" }; // missing phone & message
      const res = await WorkflowExecutionEngine.execute(badPayload);

      expect(res.status).toBe("failed");
      expect(res.logs[0].nodeName).toBe("Webhook");
      expect(res.logs[0].status).toBe("error");
    });

    it("should handle missing OPENAI_API_KEY with clean configuration error instead of fabricated response", async () => {
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const payload = {
        name: "Aman Chopra",
        phone: "+919988776655",
        message: "Looking for turnkey villa design in Delhi",
        budget: "10 Cr",
      };

      const res = await WorkflowExecutionEngine.execute(payload);
      expect(res.status).toBe("failed");
      expect(res.logs.find(l => l.nodeId === "node-ai-agent")?.status).toBe("error");
      expect(res.logs.find(l => l.nodeId === "node-ai-agent")?.error).toContain("OPENAI_API_KEY is not configured");

      process.env.OPENAI_API_KEY = originalKey;
    });

    it("should successfully execute full flow when AI agent returns qualified output", async () => {
      // Mock AIAgentService.processLead
      vi.spyOn(AIAgentService, "processLead").mockResolvedValue({
        success: true,
        modelUsed: "gpt-4o",
        structuredOutput: {
          lead_name: "Sameer Batra",
          phone: "+919307512816",
          email: "sameer@batra.in",
          property_type: "Villa",
          project_scope: "Turnkey Architecture",
          estimated_budget_cr: 7.5,
          budget_qualified: true,
          priority_level: "high",
          aesthetic_style: "Contemporary Luxury",
          summary: "Qualified ₹7.5 Cr villa.",
          recommended_action: "Book Google Meet",
          whatsapp_notification_text: "Qualified ₹7.5 Cr enquiry.",
        },
      });

      const payload = {
        name: "Sameer Batra",
        phone: "+919307512816",
        message: "Villa construction in Golf Links with ₹7.5 Cr budget",
        budget: "7.5 Cr",
      };

      const res = await WorkflowExecutionEngine.execute(payload);
      expect(res.status).toBe("success");
      expect(res.logs).toHaveLength(5);
      expect(res.logs[0].status).toBe("success"); // Webhook
      expect(res.logs[1].status).toBe("success"); // AI Agent
      expect(res.logs[2].status).toBe("success"); // Filter
      expect(res.logs[3].status).toBe("success"); // Append Row
      expect(res.logs[4].status).toBe("success"); // Notification
    });

    it("should stop downstream execution when filter rejects an under-budget inquiry", async () => {
      vi.spyOn(AIAgentService, "processLead").mockResolvedValue({
        success: true,
        modelUsed: "gpt-4o",
        structuredOutput: {
          lead_name: "Pooja Sharma",
          phone: "+919112233445",
          email: "pooja@example.com",
          property_type: "Apartment",
          project_scope: "Painting and decor",
          estimated_budget_cr: 0.5,
          budget_qualified: false,
          priority_level: "low",
          aesthetic_style: "Standard",
          summary: "Small budget project.",
          recommended_action: "Refer elsewhere.",
          whatsapp_notification_text: "Unqualified inquiry.",
        },
      });

      const payload = {
        name: "Pooja Sharma",
        phone: "+919112233445",
        message: "Painting work with 50 Lakhs budget",
        budget: "50 Lakhs",
      };

      const res = await WorkflowExecutionEngine.execute(payload);
      expect(res.status).toBe("partial");

      const filterLog = res.logs.find(l => l.nodeId === "node-filter");
      const appendRowLog = res.logs.find(l => l.nodeId === "node-append-row");
      const notifLog = res.logs.find(l => l.nodeId === "node-notification");

      expect(filterLog?.status).toBe("skipped");
      expect(appendRowLog?.status).toBe("skipped");
      expect(notifLog?.status).toBe("skipped");
    });
  });
});
