import { describe, it, expect } from "vitest";
import { parseAndFormatPhone, generateVerificationPrompt } from "../utils/phone";

describe("Phone Number Verification Utility", () => {
  it("should correctly parse and canonicalize a standard 10-digit Indian phone number", () => {
    const input = "9307512816";
    const result = parseAndFormatPhone(input);

    expect(result.isValid).toBe(true);
    expect(result.canonical).toBe("+919307512816");
    expect(result.rawDigits).toBe("9307512816");
    expect(result.spokenDigits).toBe(
      "Nine, three, zero, seven, five, one, two, eight, one, six"
    );
  });

  it("should handle phone numbers with +91 prefix and spaces", () => {
    const input = "+91 93075 12816";
    const result = parseAndFormatPhone(input);

    expect(result.isValid).toBe(true);
    expect(result.canonical).toBe("+919307512816");
    expect(result.spokenDigits).toBe(
      "Nine, three, zero, seven, five, one, two, eight, one, six"
    );
  });

  it("should correctly pronounce repeated digits and zeroes individually", () => {
    const input = "9800011223";
    const result = parseAndFormatPhone(input);

    expect(result.isValid).toBe(true);
    expect(result.spokenDigits).toBe(
      "Nine, eight, zero, zero, zero, one, one, two, two, three"
    );
  });

  it("should reject numbers with insufficient digits and return proper error", () => {
    const input = "981122";
    const result = parseAndFormatPhone(input);

    expect(result.isValid).toBe(false);
    expect(result.error).toContain("must be exactly 10 digits");
  });

  it("should generate the exact required spoken verification question", () => {
    const prompt = generateVerificationPrompt("9307512816");
    expect(prompt).toBe(
      "Let me verify that. Nine, three, zero, seven, five, one, two, eight, one, six. Have I got that exactly right?"
    );
  });

  it("should generate verification prompt with country code when requested", () => {
    const prompt = generateVerificationPrompt("9307512816", true);
    expect(prompt).toBe(
      "Let me verify that. Plus nine one, nine, three, zero, seven, five, one, two, eight, one, six. Is that correct?"
    );
  });
});
