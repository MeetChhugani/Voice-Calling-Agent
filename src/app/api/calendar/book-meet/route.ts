import { NextResponse } from "next/server";
import { CreateGoogleMeetBookingInputSchema } from "@/types";
import { GoogleCalendarService } from "@/services/google-calendar";
import { SupabaseService } from "@/services/supabase";
import { ExcelService } from "@/services/excel-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateGoogleMeetBookingInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid booking parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      full_name,
      phone,
      email,
      slot_start_time,
      slot_end_time,
      timezone,
      project_overview,
    } = parsed.data;

    // 1. First ensure lead is recorded
    const leadRes = await SupabaseService.saveOrUpdateLead({
      full_name,
      phone,
      email,
      preferred_meeting_times: `${slot_start_time} to ${slot_end_time}`,
      timezone: timezone || "Asia/Kolkata",
      lead_status: "booking_pending",
    });

    const leadId = leadRes.lead.id!;

    // 2. Perform booking via Google Calendar
    const bookingRes = await GoogleCalendarService.createBooking({
      fullName: full_name,
      phone,
      email,
      startTime: slot_start_time,
      endTime: slot_end_time,
      timezone,
      projectOverview: project_overview,
    });

    // 3. Persist meeting record honestly
    const meetingRecord = await SupabaseService.saveMeeting({
      lead_id: leadId,
      calendar_event_id: bookingRes.calendarEventId || null,
      meeting_url: bookingRes.meetingUrl || null,
      start_time: slot_start_time,
      end_time: slot_end_time,
      timezone: timezone || "Asia/Kolkata",
      booking_status: bookingRes.success ? "confirmed" : "pending",
      notes: bookingRes.message,
    });

    // 4. Save directly into Excel Workbook for Admin access
    try {
      ExcelService.recordAppointment({
        lead: leadRes.lead,
        meeting: meetingRecord.meeting,
        meetUrl: bookingRes.meetingUrl || undefined,
      });
    } catch (excelErr) {
      console.error("[ExcelService] Failed to record appointment row:", excelErr);
    }

    return NextResponse.json({
      success: bookingRes.success,
      isPending: !bookingRes.success,
      meeting: meetingRecord.meeting,
      meetingUrl: bookingRes.meetingUrl || null,
      message: bookingRes.message,
    });
  } catch (err: unknown) {
    console.error("[API calendar/book-meet] error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
