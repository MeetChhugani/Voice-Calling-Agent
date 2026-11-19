import { NextResponse } from "next/server";
import { SupportRequestService } from "@/services/support-request-service";
import { ExcelService } from "@/services/excel-service";
import { VoiceCallService, type VoiceCallTranscriptRecord } from "@/services/voice-call-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const configuredPassword = process.env.ADMIN_PASSWORD || "studio-olives-cre-2026";

    // Simple Bearer or Basic header check for secured admin access
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (token !== configuredPassword) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // Check query param for dashboard client fetch
      const { searchParams } = new URL(request.url);
      const token = searchParams.get("token");
      if (token !== configuredPassword) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const requests = await SupportRequestService.getAllRequests();
    const excelRequests = ExcelService.getAllHDFCRequests();
    let callTranscripts: VoiceCallTranscriptRecord[] = [];
    let callTranscriptWarning: string | null = null;
    try {
      callTranscripts = await VoiceCallService.getAllTranscripts();
    } catch (error) {
      console.error("[API admin/data] call transcripts unavailable:", error);
      callTranscriptWarning = "Call transcript storage is unavailable. Apply the latest Supabase migration to enable it.";
    }

    const totalRequests = requests.length;
    const fraudAlerts = requests.filter((r) => r.is_fraud_or_urgent).length;
    const pendingCallbacks = requests.filter((r) => r.status === "registered" || r.status === "in_progress").length;
    const resolvedTickets = requests.filter((r) => r.status === "resolved").length;
    const escalatedRequests = requests.filter((r) => r.status === "escalated").length;

    return NextResponse.json({
      metrics: {
        totalSessions: callTranscripts.length,
        totalRequests,
        fraudAlerts,
        pendingCallbacks,
        resolvedTickets,
        escalatedRequests,
        excelRecordsCount: excelRequests.length,
      },
      supportRequests: requests,
      callTranscripts,
      callTranscriptWarning,
      excelRecords: excelRequests,
      leads: [],
      meetings: [],
      excelAppointments: [],
    });
  } catch (err: unknown) {
    console.error("[API admin/data] error:", err);
    return NextResponse.json({ error: "Server error", message: String(err) }, { status: 500 });
  }
}
