import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { SupabaseService } from "@/services/supabase";
import { ExcelService } from "@/services/excel-service";

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

    const [leadsRes, meetingsRes] = await Promise.all([
      SupabaseService.getAllLeads(),
      SupabaseService.getAllMeetings(),
    ]);

    const excelAppointments = ExcelService.getAllAppointments();

    const totalLeads = leadsRes.leads.length;
    const qualifiedLeads = leadsRes.leads.filter(
      (l) => l.lead_status === "qualified" || l.lead_status === "booked"
    ).length;
    const confirmedMeetings = meetingsRes.meetings.filter(
      (m) => m.booking_status === "confirmed"
    ).length;
    const pendingRequests = meetingsRes.meetings.filter(
      (m) => m.booking_status === "pending"
    ).length;
    const failedBookings = meetingsRes.meetings.filter(
      (m) => m.booking_status === "failed"
    ).length;

    return NextResponse.json({
      metrics: {
        totalLeads,
        qualifiedLeads,
        confirmedMeetings,
        pendingRequests,
        failedBookings,
        excelRecordsCount: excelAppointments.length,
      },
      leads: leadsRes.leads,
      meetings: meetingsRes.meetings,
      excelAppointments,
      isFallback: leadsRes.isFallback || meetingsRes.isFallback,
    });
  } catch (err: unknown) {
    console.error("[API admin/data] error:", err);
    return NextResponse.json({ error: "Server error", message: String(err) }, { status: 500 });
  }
}
