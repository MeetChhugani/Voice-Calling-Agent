/**
 * Phone number validation and digit-by-digit spoken formatting
 * Dedicated to Studio Olives Cre voice consultation verification requirements.
 */

export interface PhoneVerificationResult {
  isValid: boolean;
  rawDigits: string;
  canonical: string; // e.g. "+919307512816"
  spokenDigits: string; // e.g. "Nine, three, zero, seven, five, one, two, eight, one, six"
  spokenWithCountryCode: string; // e.g. "Plus nine one, nine, three, zero, seven, five, one, two, eight, one, six"
  error?: string;
}

const DIGIT_WORDS: Record<string, string> = {
  "0": "zero",
  "1": "one",
  "2": "two",
  "3": "three",
  "4": "four",
  "5": "five",
  "6": "six",
  "7": "seven",
  "8": "eight",
  "9": "nine",
};

/**
 * Normalizes input string to extract digits.
 * Indian phone numbers default to +91 country code.
 */
export function parseAndFormatPhone(input: string): PhoneVerificationResult {
  if (!input || typeof input !== "string") {
    return {
      isValid: false,
      rawDigits: "",
      canonical: "",
      spokenDigits: "",
      spokenWithCountryCode: "",
      error: "Phone number input is required",
    };
  }

  // Remove non-digit chars except leading '+'
  const cleaned = input.trim().replace(/[\s\-()]/g, "");
  let digits = cleaned.replace(/\D/g, "");

  // If starts with 91 and has 12 digits, strip country code to inspect national number
  let countryCode = "+91";
  if (cleaned.startsWith("+91") && digits.length === 12) {
    digits = digits.substring(2);
  } else if (cleaned.startsWith("0") && digits.length === 11) {
    // 0 followed by 10 digits
    digits = digits.substring(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.substring(2);
  }

  // Indian mobile numbers must be 10 digits (typically starting with 6, 7, 8, or 9)
  if (digits.length !== 10) {
    return {
      isValid: false,
      rawDigits: digits,
      canonical: "",
      spokenDigits: "",
      spokenWithCountryCode: "",
      error: `Indian mobile number must be exactly 10 digits, received ${digits.length}`,
    };
  }

  // Form digit array
  const spokenList = digits.split("").map((d, index) => {
    const word = DIGIT_WORDS[d] || d;
    return index === 0 ? capitalize(word) : word;
  });

  const spokenDigits = spokenList.join(", ");
  const spokenWithCountryCode = `Plus nine one, ${spokenDigits.toLowerCase()}`;
  const canonical = `${countryCode}${digits}`;

  return {
    isValid: true,
    rawDigits: digits,
    canonical,
    spokenDigits,
    spokenWithCountryCode,
  };
}

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generates the verification question prompt for Tisha
 */
export function generateVerificationPrompt(
  input: string,
  includeCountryCode = false
): string {
  const result = parseAndFormatPhone(input);
  if (!result.isValid) {
    return "I couldn't quite catch all ten digits. Could you please share your 10-digit mobile number once more?";
  }

  if (includeCountryCode) {
    return `Let me verify that. ${result.spokenWithCountryCode}. Is that correct?`;
  }

  return `Let me verify that. ${result.spokenDigits}. Have I got that exactly right?`;
}
