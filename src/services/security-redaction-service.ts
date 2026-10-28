/**
 * Strict Banking Security & Data Redaction Service
 * Enforces RBI & HDFC Bank security guidelines:
 * - Detects and redacts OTPs, CVVs, PINs, Passwords, Full 16-digit Card Numbers
 * - Prevents sensitive credentials from being logged, transmitted, or stored
 */

export interface SecurityCheckResult {
  isSafe: boolean;
  redactedText: string;
  violationsDetected: string[];
}

export class SecurityRedactionService {
  /**
   * Scans text for sensitive authentication secrets and redacts them
   */
  public static sanitize(text: string): SecurityCheckResult {
    if (!text || typeof text !== "string") {
      return { isSafe: true, redactedText: text, violationsDetected: [] };
    }

    const violations: string[] = [];
    let redacted = text;

    // 1. Redact OTPs
    const otpPattern = /\b(?:otp|one\s*time\s*password|verification\s*code|auth\s*code|passcode)(?:[\s:=_-]+is)?[\s:=_-]*([0-9]{4,8})\b/gi;
    const afterOtp = redacted.replace(otpPattern, "[REDACTED_AUTH_SECRET]");
    if (afterOtp !== redacted) {
      violations.push("OTP_DETECTED");
      redacted = afterOtp;
    }

    // 2. Redact CVVs
    const cvvPattern = /\b(?:cvv|cvc|security\s*code|card\s*verification)(?:[\s:=_-]+is)?[\s:=_-]*([0-9]{3,4})\b/gi;
    const afterCvv = redacted.replace(cvvPattern, "[REDACTED_AUTH_SECRET]");
    if (afterCvv !== redacted) {
      violations.push("CVV_DETECTED");
      redacted = afterCvv;
    }

    // 3. Redact PINs
    const pinPattern = /\b(?:upi\s*pin|atm\s*pin|mpin|card\s*pin|secret\s*pin)(?:[\s:=_-]+is)?[\s:=_-]*([0-9]{4,6})\b/gi;
    const afterPin = redacted.replace(pinPattern, "[REDACTED_AUTH_SECRET]");
    if (afterPin !== redacted) {
      violations.push("PIN_DETECTED");
      redacted = afterPin;
    }

    // 4. Redact Passwords
    const pwdPattern = /\b(?:password|netbanking\s*pwd|login\s*password|secret\s*word)(?:[\s:=_-]+is)?[\s:=_-]*([^\s,.]+)/gi;
    const afterPwd = redacted.replace(pwdPattern, "[REDACTED_AUTH_SECRET]");
    if (afterPwd !== redacted) {
      violations.push("PASSWORD_DETECTED");
      redacted = afterPwd;
    }

    // 5. Redact Full Card Numbers
    const cardPattern = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13})\b/g;
    const spacedCardPattern = /\b([0-9]{4}[\s-][0-9]{4}[\s-][0-9]{4}[\s-][0-9]{4})\b/g;
    let afterCard = redacted.replace(cardPattern, "[REDACTED_CARD_NUMBER]");
    afterCard = afterCard.replace(spacedCardPattern, "[REDACTED_CARD_NUMBER]");
    if (afterCard !== redacted) {
      violations.push("CARD_NUMBER_DETECTED");
      redacted = afterCard;
    }

    return {
      isSafe: violations.length === 0,
      redactedText: redacted,
      violationsDetected: violations,
    };
  }

  /**
   * Safety banner for customers reminding never to share secrets
   */
  public static getSecurityWarning(): string {
    return "HDFC Bank Security Reminder: Bank officials will NEVER ask for your OTP, UPI PIN, ATM PIN, NetBanking password, or CVV. Never share these with anyone.";
  }
}
