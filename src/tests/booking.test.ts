import { describe, it, expect } from "vitest";
import { SupportRequestService } from "../services/support-request-service";
import { SecurityRedactionService } from "../services/security-redaction-service";
import { BankKnowledgeService } from "../services/bank-knowledge-service";

describe("Support Request & Security Persistence Verification", () => {
  it("creates a support request with genuine ticket ID format", async () => {
    const res = await SupportRequestService.createRequest({
      customer_name: "Amit Patel",
      phone: "+919876543210",
      category: "cards",
      issue_summary: "Wants information about Millennia credit card reward points.",
      phone_verified: true,
    });

    expect(res.success).toBe(true);
    expect(res.ticket.id).toMatch(/^HDFC-SR-\d{6}$/);
    expect(res.ticket.customer_name).toBe("Amit Patel");
    expect(res.ticket.status).toBe("registered");
  });

  it("sanitizes OTP and PIN credentials automatically before storage", async () => {
    const res = await SupportRequestService.createRequest({
      customer_name: "Sneha Rao",
      phone: "+919811223344",
      issue_summary: "My OTP is 492019 and my ATM PIN is 8492 please help.",
    });

    expect(res.ticket.issue_summary).not.toContain("492019");
    expect(res.ticket.issue_summary).not.toContain("8492");
    expect(res.ticket.issue_summary).toContain("[REDACTED_AUTH_SECRET]");
    expect(res.warning).toBeDefined();
  });

  it("retrieves verified bank knowledge with official helplines", () => {
    const results = BankKnowledgeService.search("millennia credit card");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("Millennia");

    const helplines = BankKnowledgeService.getOfficialHelplines();
    expect(helplines.national_toll_free).toBe("1800 1600");
    expect(helplines.alternate_toll_free).toBe("1800 2600");
  });

  it("finds existing requests by ticket ID or phone number", async () => {
    const res = await SupportRequestService.createRequest({
      customer_name: "Vikram Malhotra",
      phone: "+919988776655",
      issue_summary: "Home loan balance transfer consultation request.",
    });

    const foundByTicket = SupportRequestService.findByTicketOrPhone(res.ticket.id);
    expect(foundByTicket.length).toBeGreaterThan(0);
    expect(foundByTicket[0].id).toBe(res.ticket.id);

    const foundByPhone = SupportRequestService.findByTicketOrPhone("9988776655");
    expect(foundByPhone.length).toBeGreaterThan(0);
  });
});
