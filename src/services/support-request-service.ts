import fs from "fs";
import path from "path";
import { SupportRequest, SupportRequestSchema } from "@/types";
import { SecurityRedactionService } from "./security-redaction-service";
import { ExcelService } from "./excel-service";

const IN_MEMORY_SUPPORT_REQUESTS: SupportRequest[] = [
  {
    id: "HDFC-SR-100234",
    customer_name: "Rohan Verma",
    phone: "+919811002233",
    phone_verified: true,
    email: "rohan.verma@example.com",
    category: "cards",
    product_type: "Millennia Credit Card",
    issue_summary: "Inquiry regarding cashback redemption and annual fee waiver terms on Millennia card.",
    is_fraud_or_urgent: false,
    preferred_callback_time: "Today between 2 PM - 4 PM",
    consent_given: true,
    status: "registered",
    official_reference_channel: "HDFC Bank Credit Cards Customer Care",
    agent_notes: "Customer verified phone number. Advised to review NetBanking cards portal.",
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "HDFC-SR-100235",
    customer_name: "Pooja Sharma",
    phone: "+919876543210",
    phone_verified: true,
    email: "pooja.sharma@example.com",
    category: "loans",
    product_type: "Home Loan",
    issue_summary: "Wants consultation on Home Loan balance transfer and top-up eligibility.",
    is_fraud_or_urgent: false,
    preferred_callback_time: "Tomorrow morning",
    consent_given: true,
    status: "in_progress",
    official_reference_channel: "HDFC Bank Retail Asset Branch",
    agent_notes: "Advised to keep current loan statement handy for branch executive review.",
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
];

export class SupportRequestService {
  private static getJsonPath(): string {
    return path.join(process.cwd(), "data", "hdfc_support_requests.json");
  }

  private static tryReadDisk(): SupportRequest[] | null {
    if (process.env.VERCEL === "1") return null;
    try {
      const p = this.getJsonPath();
      if (!fs.existsSync(p)) return null;
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch {
      return null;
    }
  }

  private static tryWriteDisk(records: SupportRequest[]): void {
    if (process.env.VERCEL === "1") return;
    try {
      const dataDir = path.join(process.cwd(), "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(this.getJsonPath(), JSON.stringify(records, null, 2), "utf-8");
    } catch {
      // Best-effort in read-only environment
    }
  }

  /**
   * Retrieves all customer assistance requests
   */
  public static getAllRequests(): SupportRequest[] {
    const disk = this.tryReadDisk();
    if (disk && disk.length > 0) {
      IN_MEMORY_SUPPORT_REQUESTS.length = 0;
      IN_MEMORY_SUPPORT_REQUESTS.push(...disk);
    }
    return [...IN_MEMORY_SUPPORT_REQUESTS];
  }

  /**
   * Create a genuine support request / callback ticket
   */
  public static async createRequest(params: {
    customer_name: string;
    phone: string;
    phone_verified?: boolean;
    email?: string | null;
    category?: SupportRequest["category"];
    product_type?: string | null;
    issue_summary: string;
    is_fraud_or_urgent?: boolean;
    preferred_callback_time?: string | null;
    consent_given?: boolean;
    agent_notes?: string | null;
  }): Promise<{ success: boolean; ticket: SupportRequest; warning?: string }> {
    // 1. Sanitize all incoming text against security leaks
    const sanitizedSummary = SecurityRedactionService.sanitize(params.issue_summary);
    const sanitizedNotes = params.agent_notes ? SecurityRedactionService.sanitize(params.agent_notes) : null;

    // Generate genuine 6-digit ticket reference
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketId = `HDFC-SR-${randomSuffix}`;

    const newTicket: SupportRequest = {
      id: ticketId,
      customer_name: params.customer_name.trim(),
      phone: params.phone.trim(),
      phone_verified: Boolean(params.phone_verified),
      email: params.email?.trim() || null,
      category: params.category || "general",
      product_type: params.product_type || null,
      issue_summary: sanitizedSummary.redactedText,
      is_fraud_or_urgent: Boolean(params.is_fraud_or_urgent),
      preferred_callback_time: params.preferred_callback_time || "Earliest business hours",
      consent_given: params.consent_given !== false,
      status: params.is_fraud_or_urgent ? "escalated" : "registered",
      official_reference_channel: params.is_fraud_or_urgent
        ? "HDFC Bank 24x7 Emergency Helpdesk (1800 1600)"
        : "HDFC Bank Service Request Desk (1800 2600)",
      agent_notes: sanitizedNotes?.redactedText || (sanitizedSummary.violationsDetected.length > 0
        ? `[Security Note: Customer message contained credentials that were automatically redacted.]`
        : null),
      created_at: new Date().toISOString(),
    };

    const requests = this.getAllRequests();
    requests.unshift(newTicket);

    IN_MEMORY_SUPPORT_REQUESTS.length = 0;
    IN_MEMORY_SUPPORT_REQUESTS.push(...requests);
    this.tryWriteDisk(requests);

    // Sync into Excel master sheet
    try {
      await ExcelService.recordHDFCSupportRequest(newTicket);
    } catch (e) {
      console.error("[SupportRequestService] Excel write notice:", e);
    }

    return {
      success: true,
      ticket: newTicket,
      warning: sanitizedSummary.violationsDetected.length > 0
        ? "Notice: Sensitive authentication secrets detected and redacted from record."
        : undefined,
    };
  }

  /**
   * Search requests by Ticket ID or Customer Phone
   */
  public static findByTicketOrPhone(query: string): SupportRequest[] {
    const clean = query.trim().toLowerCase();
    const cleanDigits = query.replace(/\D/g, "");
    const all = this.getAllRequests();

    return all.filter((r) => {
      if (r.id.toLowerCase() === clean) return true;
      if (cleanDigits.length >= 5) {
        const rDigits = r.phone.replace(/\D/g, "");
        if (rDigits.includes(cleanDigits) || cleanDigits.includes(rDigits)) return true;
      }
      return false;
    });
  }
}
