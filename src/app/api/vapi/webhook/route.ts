import { NextResponse } from "next/server";
import { CheckCalendarAvailabilityInputSchema, CreateGoogleMeetBookingInputSchema, SaveLeadInputSchema } from "@/types";
import { GoogleCalendarService } from "@/services/google-calendar";
import { SupabaseService } from "@/services/supabase";
import { ExcelService } from "@/services/excel-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    // Vapi function-call format
    if (message?.type === "tool-calls" || message?.type === "function-call") {
      const toolCall = message.toolCall || message.toolCalls?.[0] || message.functionCall;
      const functionName = toolCall?.function?.name || toolCall?.name;
      const rawArgs = toolCall?.function?.arguments || toolCall?.parameters;
      const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

      console.log(`[Vapi Webhook] Processing tool call: ${functionName}`, args);

      if (functionName === "check_calendar_availability") {
        const parsed = CheckCalendarAvailabilityInputSchema.safeParse(args);
        if (!parsed.success) {
          return NextResponse.json({
            results: [{
              toolCallId: toolCall.id,
              result: { error: "Invalid date format. Please provide YYYY-MM-DD." }
            }]
          });
        }

        const availability = await GoogleCalendarService.checkAvailability(
          parsed.data.preferred_date,
          parsed.data.preferred_time_range,
          parsed.data.timezone
        );

        return NextResponse.json({
          results: [{
            toolCallId: toolCall.id,
            result: availability
          }]
        });
      }

      if (functionName === "create_google_meet_booking") {
        const parsed = CreateGoogleMeetBookingInputSchema.safeParse(args);
        if (!parsed.success) {
          return NextResponse.json({
            results: [{
              toolCallId: toolCall.id,
              result: { error: "Missing required details to create the meeting." }
            }]
          });
        }

        // 1. Persist lead
        const leadRes = await SupabaseService.saveOrUpdateLead({
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          email: parsed.data.email,
          lead_status: "booking_pending",
          preferred_meeting_times: `${parsed.data.slot_start_time} - ${parsed.data.slot_end_time}`,
        });

        // 2. Perform booking
        const bookingRes = await GoogleCalendarService.createBooking({
          fullName: parsed.data.full_name,
          phone: parsed.data.phone,
          email: parsed.data.email,
          startTime: parsed.data.slot_start_time,
          endTime: parsed.data.slot_end_time,
          timezone: parsed.data.timezone,
          projectOverview: parsed.data.project_overview,
        });

        // 3. Persist meeting
        const meetingSaved = await SupabaseService.saveMeeting({
          lead_id: leadRes.lead.id!,
          calendar_event_id: bookingRes.calendarEventId || null,
          meeting_url: bookingRes.meetingUrl || null,
          start_time: parsed.data.slot_start_time,
          end_time: parsed.data.slot_end_time,
          timezone: parsed.data.timezone || "Asia/Kolkata",
          booking_status: bookingRes.success ? "confirmed" : "pending",
          notes: bookingRes.message,
        });

        // 4. Record to Excel (.xlsx) file
        try {
          ExcelService.recordAppointment({
            lead: leadRes.lead,
            meeting: meetingSaved.meeting,
            meetUrl: bookingRes.meetingUrl || undefined,
          });
        } catch (excelErr) {
          console.error("[ExcelService Webhook] Error:", excelErr);
        }

        return NextResponse.json({
          results: [{
            toolCallId: toolCall.id,
            result: {
              status: bookingRes.success ? "confirmed" : "pending",
              meeting_url: bookingRes.meetingUrl || null,
              message: bookingRes.message,
            }
          }]
        });
      }

      if (functionName === "save_or_update_lead") {
        const parsed = SaveLeadInputSchema.safeParse(args);
        if (!parsed.success) {
          return NextResponse.json({
            results: [{
              toolCallId: toolCall.id,
              result: { error: "Invalid lead parameters." }
            }]
          });
        }

        const leadRes = await SupabaseService.saveOrUpdateLead(parsed.data);
        return NextResponse.json({
          results: [{
            toolCallId: toolCall.id,
            result: {
              success: true,
              lead_id: leadRes.lead.id,
              lead_status: leadRes.lead.lead_status,
            }
          }]
        });
      }
    }

    // End of call summary event handling
    if (message?.type === "end-of-call-report") {
      const summary = message.summary || message.analysis?.summary;
      const customer = message.customer;
      if (customer?.number || message.call?.customer?.number) {
        const phone = customer?.number || message.call?.customer?.number;
        await SupabaseService.saveOrUpdateLead({
          full_name: message.customer?.name || "Consultation Caller",
          phone,
          call_summary: summary,
          lead_status: "qualifying",
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("[API vapi/webhook] error:", err);
    return NextResponse.json({ error: "Webhook error", message: String(err) }, { status: 500 });
  }
}
