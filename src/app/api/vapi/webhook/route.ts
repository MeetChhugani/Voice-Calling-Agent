import { NextResponse } from "next/server";
import {
  SearchBankInfoInputSchema,
  CreateSupportRequestInputSchema,
  ReportFraudEmergencyInputSchema,
  FindBranchAtmInputSchema,
  GetSupportRequestStatusInputSchema,
} from "@/types";
import { BankKnowledgeService } from "@/services/bank-knowledge-service";
import { SupportRequestService } from "@/services/support-request-service";
import { SecurityRedactionService } from "@/services/security-redaction-service";
import { SupabaseService } from "@/services/supabase";

export const dynamic = "force-dynamic";

function toolResult(toolCallId: string, result: unknown) {
  return NextResponse.json({
    results: [{ toolCallId, result }],
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    // ── TOOL CALLS ──────────────────────────────────────────────────────────
    if (message?.type === "tool-calls" || message?.type === "function-call") {
      const toolCall =
        message.toolCall ||
        message.toolCalls?.[0] ||
        message.functionCall;
      const functionName =
        toolCall?.function?.name || toolCall?.name;
      const rawArgs =
        toolCall?.function?.arguments || toolCall?.parameters;
      const args =
        typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs ?? {};
      const tcId: string = toolCall?.id ?? "unknown";

      console.log(`[Vapi Webhook] Tool: ${functionName}`, args);

      // ── search_verified_bank_information ────────────────────────────────
      if (functionName === "search_verified_bank_information") {
        const parsed = SearchBankInfoInputSchema.safeParse(args);
        if (!parsed.success) {
          return toolResult(tcId, {
            error: "Invalid query. Please provide a search term.",
          });
        }
        const articles = BankKnowledgeService.search(
          parsed.data.query,
          parsed.data.category
        );
        if (articles.length === 0) {
          return toolResult(tcId, {
            found: false,
            message:
              "I don't have verified information on that specific topic. I recommend visiting www.hdfcbank.com or calling 1800 1600 for accurate details.",
            helplines: BankKnowledgeService.getOfficialHelplines(),
          });
        }
        const top = articles.slice(0, 2);
        return toolResult(tcId, {
          found: true,
          results: top.map((a) => ({
            title: a.title,
            summary: a.summary,
            source_url: a.officialSourceUrl,
            key_details: a.keyDetails,
          })),
        });
      }

      // ── create_support_request ──────────────────────────────────────────
      if (functionName === "create_support_request") {
        const parsed = CreateSupportRequestInputSchema.safeParse(args);
        if (!parsed.success) {
          return toolResult(tcId, {
            error:
              "Missing required details (name, phone, issue_summary). Please provide them.",
          });
        }
        // Sanitize before storing
        const sanitized = SecurityRedactionService.sanitize(
          parsed.data.issue_summary
        );
        const result = await SupportRequestService.createRequest({
          customer_name: parsed.data.customer_name,
          phone: parsed.data.phone,
          phone_verified: parsed.data.phone_verified,
          email: parsed.data.email,
          category: parsed.data.category,
          product_type: parsed.data.product_type,
          issue_summary: sanitized.redactedText,
          is_fraud_or_urgent: false,
          preferred_callback_time: parsed.data.preferred_callback_time,
          consent_given: parsed.data.consent_given,
        });
        return toolResult(tcId, {
          success: true,
          ticket_id: result.ticket.id,
          status: result.ticket.status,
          message: `Your service request has been registered. Your ticket ID is ${result.ticket.id}. Our team will contact you at the number provided during business hours.`,
          warning: result.warning,
        });
      }

      // ── report_fraud_emergency ──────────────────────────────────────────
      if (functionName === "report_fraud_emergency") {
        const parsed = ReportFraudEmergencyInputSchema.safeParse(args);
        if (!parsed.success) {
          return toolResult(tcId, {
            immediate_action:
              "Please call HDFC Bank 24x7 emergency helpline immediately: 1800 1600 or 1800 2600.",
            helplines: BankKnowledgeService.getOfficialHelplines(),
          });
        }
        const sanitizedDesc = SecurityRedactionService.sanitize(
          parsed.data.details || parsed.data.incident_type
        );
        const result = await SupportRequestService.createRequest({
          customer_name: parsed.data.customer_name,
          phone: parsed.data.phone,
          issue_summary: sanitizedDesc.redactedText,
          category: "fraud_emergency",
          is_fraud_or_urgent: true,
          agent_notes: `FRAUD/EMERGENCY ALERT. Incident type: ${parsed.data.incident_type}. Auto-escalated for immediate callback.`,
        });
        return toolResult(tcId, {
          emergency_logged: true,
          ticket_id: result.ticket.id,
          immediate_actions: [
            "IMMEDIATELY call HDFC Bank 24x7 helpline: 1800 1600 or 1800 2600",
            "Block your card via NetBanking: Cards > Request > Hotlisting",
            "Block via MobileBanking App > Cards > Block Card",
            "File cybercrime report at cybercrime.gov.in if money was lost",
          ],
          message: `Emergency alert logged (${result.ticket.id}). Please call 1800 1600 immediately for urgent card blocking and account security.`,
          helplines: BankKnowledgeService.getOfficialHelplines(),
        });
      }

      // ── find_official_branch_or_atm ─────────────────────────────────────
      if (functionName === "find_official_branch_or_atm") {
        const parsed = FindBranchAtmInputSchema.safeParse(args);
        const city = parsed.success ? parsed.data.city_or_pincode : "your area";
        const type = parsed.success ? (parsed.data.query_type || "branch or ATM") : "branch or ATM";
        return toolResult(tcId, {
          found: true,
          locator_url: `https://www.hdfcbank.com/branch-atm-locator?query=${encodeURIComponent(city)}`,
          message: `To find the nearest HDFC Bank ${type} in ${city}, please visit hdfcbank.com/branch-atm-locator or open your HDFC MobileBanking app and tap on 'Locate Us'. You can also call 1800 1600 for branch assistance.`,
          helplines: BankKnowledgeService.getOfficialHelplines(),
        });
      }

      // ── get_support_request_status ──────────────────────────────────────
      if (functionName === "get_support_request_status") {
        const parsed = GetSupportRequestStatusInputSchema.safeParse(args);
        if (!parsed.success) {
          return toolResult(tcId, {
            error: "Please provide a valid ticket ID or phone number to check status.",
          });
        }
        const lookupKey = parsed.data.request_id || parsed.data.phone || "";
        const matches = await SupportRequestService.findByTicketOrPhoneAsync(lookupKey);
        if (matches.length === 0) {
          return toolResult(tcId, {
            found: false,
            message:
              "No service request found with that ticket ID or phone number. Please check the details or call 1800 2600 for assistance.",
          });
        }
        return toolResult(tcId, {
          found: true,
          requests: matches.map((r) => ({
            ticket_id: r.id,
            status: r.status,
            category: r.category,
            created_at: r.created_at,
            preferred_callback_time: r.preferred_callback_time,
          })),
          message: `Found ${matches.length} request(s) for you.`,
        });
      }

      // Unknown tool
      console.warn(`[Vapi Webhook] Unknown tool: ${functionName}`);
      return NextResponse.json({ received: true });
    }

    // ── END-OF-CALL REPORT ────────────────────────────────────────────────
    if (message?.type === "end-of-call-report") {
      const phone =
        message.customer?.number ||
        message.call?.customer?.number;
      const summary = message.summary || message.analysis?.summary || "";
      if (phone) {
        try {
          await SupabaseService.saveOrUpdateLead({
            full_name: message.customer?.name || "HDFC Assist Caller",
            phone,
            call_summary: summary,
            lead_status: "qualifying",
          });
        } catch (e) {
          console.error("[Webhook] end-of-call Supabase error:", e);
        }
      }
      console.log("[Vapi Webhook] End of call recorded. Phone:", phone);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[API vapi/webhook] error:", err);
    return NextResponse.json(
      { error: "Webhook error", message: String(err) },
      { status: 500 }
    );
  }
}
