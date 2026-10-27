import { describe, it, expect } from "vitest";
import { GoogleCalendarService } from "../services/google-calendar";
import { SupabaseService } from "../services/supabase";

describe("Booking and Persistence Graceful Fallback Verification", () => {
  it("checkAvailability returns structured slots and honest isConnected flag", async () => {
    const result = await GoogleCalendarService.checkAvailability("2026-10-20");
    expect(result.slots.length).toBeGreaterThan(0);
    expect(result.slots[0]).toHaveProperty("start");
    expect(result.slots[0]).toHaveProperty("display");
    // Since Google credentials are not set in test environment, isConnected must be false
    expect(result.isConnected).toBe(false);
  });

  it("createBooking does not invent fake Google Meet links without credentials", async () => {
    const result = await GoogleCalendarService.createBooking({
      fullName: "Ananya Roy",
      phone: "+919876543210",
      email: "ananya@example.com",
      startTime: "2026-10-20T11:30:00+05:30",
      endTime: "2026-10-20T12:15:00+05:30",
    });

    expect(result.success).toBe(false);
    expect(result.isMockedOrPending).toBe(true);
    expect(result.meetingUrl).toBeUndefined();
    expect(result.message).toContain("booking_pending");
  });

  it("persists lead and meeting records in store", async () => {
    const leadRes = await SupabaseService.saveOrUpdateLead({
      full_name: "Karan Johar",
      phone: "+919822334455",
      lead_status: "booking_pending",
      property_city: "Mumbai",
      budget_fit: true,
    });

    expect(leadRes.success).toBe(true);
    expect(leadRes.lead.id).toBeDefined();

    const meetRes = await SupabaseService.saveMeeting({
      lead_id: leadRes.lead.id!,
      calendar_event_id: null,
      meeting_url: null,
      start_time: "2026-10-22T14:00:00+05:30",
      end_time: "2026-10-22T14:45:00+05:30",
      timezone: "Asia/Kolkata",
      booking_status: "pending",
      notes: "Pending Google Calendar configuration",
    });

    expect(meetRes.success).toBe(true);
    expect(meetRes.meeting.booking_status).toBe("pending");
  });
});
