import { NextResponse } from "next/server";
import { SupportRequestService } from "@/services/support-request-service";
import { BankKnowledgeService } from "@/services/bank-knowledge-service";
import { ReportFraudEmergencyInputSchema } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ReportFraudEmergencyInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
    }
    const result = await SupportRequestService.createRequest({
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      phone_verified: false,
      issue_summary: parsed.data.details || parsed.data.incident_type,
      category: "fraud_emergency" as any,
      is_fraud_or_urgent: true,
      agent_notes: `FRAUD ALERT. Type: ${parsed.data.incident_type}. Auto-escalated.`,
    });
    return NextResponse.json({
      emergency_logged: true,
      ticket_id: result.ticket.id,
      helplines: BankKnowledgeService.getOfficialHelplines(),
      message: "Emergency alert registered. Please also call 1800 1600 immediately.",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
