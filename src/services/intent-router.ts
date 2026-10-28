import { BankingCategory } from "@/types";

export type BankingIntentType =
  | "general_inquiry"
  | "product_discovery"
  | "existing_support"
  | "fraud_emergency"
  | "complaint_or_callback";

export interface IntentClassificationResult {
  intent: BankingIntentType;
  category: BankingCategory;
  confidence: number;
  urgencyLevel: "emergency" | "high" | "standard";
  urgency: "emergency" | "high" | "standard"; // alias
  requiresImmediateOfficialRouting: boolean;
  recommendedOfficialChannel: string;
  officialRoutingChannel: string; // alias
}

export class IntentRouter {
  /**
   * Classifies user inquiry into distinct banking conversation flows
   */
  public static classify(input: string): IntentClassificationResult {
    const text = input.toLowerCase().trim();

    // ─── 1. Check Fraud / Emergency First (Highest Priority) ───────────────
    const fraudTriggers = [
      "fraud",
      "scam",
      "lost card",
      "stolen card",
      "stole",
      "stolen",
      "card chori",
      "money debited",
      "debited without",
      "without my consent",
      "without permission",
      "paisa kat gaya",
      "unauthorized",
      "anpadh",
      "hacked",
      "otp aya",
      "suspicious",
      "phishing",
      "block card",
      "card block",
      "atm me card phans gaya",
      "wrong deduction",
    ];

    if (fraudTriggers.some((t) => text.includes(t))) {
      return {
        intent: "fraud_emergency",
        category: "fraud_emergency",
        confidence: 0.95,
        urgencyLevel: "emergency",
        urgency: "emergency",
        requiresImmediateOfficialRouting: true,
        recommendedOfficialChannel: "HDFC Bank 24x7 Emergency Helpline (1800 1600 / 1800 2600)",
        officialRoutingChannel: "HDFC Bank 24x7 Emergency Helpline (1800 1600 / 1800 2600)",
      };
    }

    // ─── 2. Complaint or Callback Request ────────────────────────────────────
    const complaintTriggers = [
      "complaint",
      "shikayat",
      "talk to manager",
      "branch issue",
      "grievance",
      "callback",
      "call back",
      "register issue",
      "ticket",
    ];

    if (complaintTriggers.some((t) => text.includes(t))) {
      return {
        intent: "complaint_or_callback",
        category: "customer_service",
        confidence: 0.9,
        urgencyLevel: "high",
        urgency: "high",
        requiresImmediateOfficialRouting: false,
        recommendedOfficialChannel: "HDFC Bank Customer Support Desk (1800 2600)",
        officialRoutingChannel: "HDFC Bank Customer Support Desk (1800 2600)",
      };
    }

    // ─── 3. Existing Customer Support ────────────────────────────────────────
    const supportTriggers = [
      "my account",
      "my balance",
      "statement",
      "check status",
      "request id",
      "cheque book",
      "debit card status",
      "pin reset",
      "netbanking locked",
      "password reset",
    ];

    if (supportTriggers.some((t) => text.includes(t))) {
      return {
        intent: "existing_support",
        category: "digital_banking",
        confidence: 0.88,
        urgencyLevel: "standard",
        urgency: "standard",
        requiresImmediateOfficialRouting: false,
        recommendedOfficialChannel: "HDFC NetBanking (netbanking.hdfcbank.com) or PhoneBanking 1800 1600",
        officialRoutingChannel: "HDFC NetBanking (netbanking.hdfcbank.com) or PhoneBanking 1800 1600",
      };
    }

    // ─── 4. Product Discovery & Applications ─────────────────────────────────
    let matchedCategory: BankingCategory = "general";
    if (text.includes("loan") || text.includes("home loan") || text.includes("car loan") || text.includes("personal loan")) {
      matchedCategory = "loans";
    } else if (text.includes("card") || text.includes("millennia") || text.includes("regalia") || text.includes("credit card") || text.includes("debit card")) {
      matchedCategory = "cards";
    } else if (text.includes("deposit") || text.includes("fd") || text.includes("fixed deposit") || text.includes("rd") || text.includes("recurring deposit")) {
      matchedCategory = "deposits";
    } else if (text.includes("savings") || text.includes("salary") || text.includes("account") || text.includes("current account")) {
      matchedCategory = "accounts";
    } else if (text.includes("app") || text.includes("upi") || text.includes("netbanking") || text.includes("payzapp")) {
      matchedCategory = "digital_banking";
    }

    const discoveryTriggers = [
      "apply",
      "open",
      "interest rate",
      "eligibility",
      "features",
      "benefits",
      "tenure",
      "how to",
      "which",
      "best",
      "options",
      "rate",
    ];

    const isDiscovery = discoveryTriggers.some((t) => text.includes(t));

    return {
      intent: isDiscovery ? "product_discovery" : "general_inquiry",
      category: matchedCategory,
      confidence: 0.85,
      urgencyLevel: "standard",
      urgency: "standard",
      requiresImmediateOfficialRouting: false,
      recommendedOfficialChannel: "HDFC Bank Official Portal (www.hdfcbank.com)",
      officialRoutingChannel: "HDFC Bank Official Portal (www.hdfcbank.com)",
    };
  }
}
