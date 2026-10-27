import { describe, it, expect } from "vitest";
import { TISHA_SYSTEM_PROMPT } from "../config/tisha-system-prompt";

describe("Tisha Conversation Rules and Prompt Verification", () => {
  it("enforces asking caller's name first", () => {
    expect(TISHA_SYSTEM_PROMPT).toContain("May I know your name, please?");
    expect(TISHA_SYSTEM_PROMPT).toContain(
      "The very first substantive question in every new conversation MUST ask the caller's name"
    );
    expect(TISHA_SYSTEM_PROMPT).toContain('Do not begin with a generic "How can I help you?"');
  });

  it("enforces asking exactly one question at a time", () => {
    expect(TISHA_SYSTEM_PROMPT).toContain("Ask EXACTLY ONE question at a time and wait for the caller's answer");
    expect(TISHA_SYSTEM_PROMPT).toContain("NEVER read a list of questions aloud");
  });

  it("includes all required luxury brand facts", () => {
    expect(TISHA_SYSTEM_PROMPT).toContain("Studio Olives Cre was established in 2016");
    expect(TISHA_SYSTEM_PROMPT).toContain("Approximately 75");
    expect(TISHA_SYSTEM_PROMPT).toContain("Over 50 luxury completed projects");
    expect(TISHA_SYSTEM_PROMPT).toContain("E-39 Naraina Vihar, New Delhi");
    expect(TISHA_SYSTEM_PROMPT).toContain("Hardik Pandya");
    expect(TISHA_SYSTEM_PROMPT).toContain("five crore rupees");
  });

  it("prohibits misrepresenting as a human architect or generating CAD designs", () => {
    expect(TISHA_SYSTEM_PROMPT).toContain("You are NOT a human architect or designer");
    expect(TISHA_SYSTEM_PROMPT).toContain("Do not misrepresent yourself or claim to have performed actual design work");
  });

  it("prioritizes online consultation before site visits", () => {
    expect(TISHA_SYSTEM_PROMPT).toContain("Always recommend an online consultation with the senior design team before considering a site visit");
  });
});
