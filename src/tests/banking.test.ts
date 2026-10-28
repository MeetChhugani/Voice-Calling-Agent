import { describe, it, expect } from "vitest";
import { IntentRouter } from "../services/intent-router";
import { SecurityRedactionService } from "../services/security-redaction-service";
import { ExcelService } from "../services/excel-service";

describe("HDFC Banking System & Intent Routing Tests", () => {
  it("classifies emergency fraud intent correctly", () => {
    const intent = IntentRouter.classify("Someone stole my card and debited 50000 rupees without my consent");
    expect(intent.intent).toBe("fraud_emergency");
    expect(intent.urgency).toBe("emergency");
    expect(intent.officialRoutingChannel).toContain("1800 1600");
  });

  it("classifies product discovery for loan queries", () => {
    const intent = IntentRouter.classify("What are the interest rates and tenure for a home loan?");
    expect(intent.intent).toBe("product_discovery");
    expect(intent.category).toBe("loans");
    expect(intent.urgency).toBe("standard");
  });

  it("classifies credit card inquiries", () => {
    const intent = IntentRouter.classify("Tell me about Millennia and Regalia Gold credit cards");
    expect(intent.category).toBe("cards");
  });

  it("redacts CVV, OTP, and 16-digit card numbers thoroughly", () => {
    const dirty = "Here is my card 4532 1234 5678 9010 and CVV 789 with OTP 123456";
    const cleaned = SecurityRedactionService.sanitize(dirty);

    expect(cleaned.violationsDetected.length).toBeGreaterThanOrEqual(2);
    expect(cleaned.redactedText).not.toContain("4532 1234 5678 9010");
    expect(cleaned.redactedText).not.toContain("789");
    expect(cleaned.redactedText).not.toContain("123456");
  });

  it("generates genuine HDFC Excel workbook buffer with rows", async () => {
    const buffer = await ExcelService.generateExcelBuffer();
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);
  });
});
