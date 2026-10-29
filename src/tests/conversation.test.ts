import { describe, it, expect } from "vitest";
import { DHRUV_BANKING_SYSTEM_PROMPT } from "../config/dhruv-system-prompt";

describe("Dhruv Banking Conversation Rules and Prompt Verification", () => {
  it("enforces asking customer's name first", () => {
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("May I know your name, please?");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain(
      "The very first question in every new conversation MUST ask the customer's name"
    );
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("Sabse pehle, aapka naam jaan sakta hoon?");
  });

  it("enforces asking exactly one question at a time", () => {
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("Ask EXACTLY ONE question at a time and wait for the customer's response");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("NEVER rapid-fire a list of questions");
  });

  it("strictly prohibits asking for OTP, PIN, CVV, or passwords", () => {
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("NEVER ASK THE CUSTOMER FOR:");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("OTPs or verification codes");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("UPI PINs or ATM PINs");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("CVVs (3-digit card security code)");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("Please stop right there! For your security, HDFC Bank will never ask for your OTP");
  });

  it("includes official 24x7 customer care helplines and approved facts", () => {
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("1800 1600");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("1800 2600");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("Millennia Credit Card");
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("Regalia Gold");
  });

  it("requires digit-by-digit verification for phone numbers", () => {
    expect(DHRUV_BANKING_SYSTEM_PROMPT).toContain("ALWAYS verify it by repeating every digit separately");
  });
});
