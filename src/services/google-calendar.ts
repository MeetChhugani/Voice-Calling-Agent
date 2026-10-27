import { google } from "googleapis";

export interface AvailableSlot {
  start: string; // ISO string
  end: string;   // ISO string
  display: string; // e.g. "Thursday, Oct 15 at 3:00 PM IST"
}

export interface BookingResult {
  success: boolean;
  meetingUrl?: string;
  calendarEventId?: string;
  isMockedOrPending: boolean;
  message: string;
}

export class GoogleCalendarService {
  private static getCalendarClient() {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (serviceAccountEmail && privateKey) {
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey,
        scopes: [
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/calendar.events",
        ],
      });
      return google.calendar({ version: "v3", auth });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
      oauth2Client.setCredentials({ refresh_token: refreshToken });
      return google.calendar({ version: "v3", auth: oauth2Client });
    }

    return null;
  }

  /**
   * Check real availability or return genuine mock slots if calendar credentials are not configured yet
   */
  static async checkAvailability(
    preferredDate: string,
    timeRange?: string,
    timezone = "Asia/Kolkata"
  ): Promise<{ slots: AvailableSlot[]; isConnected: boolean; message: string }> {
    const calendar = this.getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    if (!calendar) {
      // Graceful fallback: propose valid structured 45-minute slots on the requested date
      const dateTarget = new Date(preferredDate);
      if (isNaN(dateTarget.getTime())) {
        return {
          slots: [],
          isConnected: false,
          message: "Invalid date specified. Please provide a date in YYYY-MM-DD format.",
        };
      }

      // Generate two real business slots on that date (e.g. 11:30 AM and 3:30 PM IST)
      const slot1Start = new Date(dateTarget);
      slot1Start.setHours(11, 30, 0, 0);
      const slot1End = new Date(slot1Start.getTime() + 45 * 60000);

      const slot2Start = new Date(dateTarget);
      slot2Start.setHours(15, 30, 0, 0);
      const slot2End = new Date(slot2Start.getTime() + 45 * 60000);

      const slots: AvailableSlot[] = [
        {
          start: slot1Start.toISOString(),
          end: slot1End.toISOString(),
          display: `${slot1Start.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })} at 11:30 AM IST`,
        },
        {
          start: slot2Start.toISOString(),
          end: slot2End.toISOString(),
          display: `${slot2Start.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })} at 3:30 PM IST`,
        },
      ];

      return {
        slots,
        isConnected: false,
        message: "Google Calendar is running in simulated scheduling mode. 2 slots available.",
      };
    }

    try {
      const startDate = new Date(preferredDate);
      startDate.setHours(9, 0, 0, 0);
      const endDate = new Date(preferredDate);
      endDate.setHours(19, 0, 0, 0);

      const freeBusyRes = await calendar.freebusy.query({
        requestBody: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          timeZone: timezone,
          items: [{ id: calendarId }],
        },
      });

      const busySlots = freeBusyRes.data.calendars?.[calendarId]?.busy || [];

      // Propose up to 2 slots between 10:00 and 18:00
      const candidateSlots = [11, 15, 17];
      const available: AvailableSlot[] = [];

      for (const hour of candidateSlots) {
        if (available.length >= 2) break;

        const slotStart = new Date(preferredDate);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 45 * 60000);

        // Check collision
        const hasOverlap = busySlots.some((busy) => {
          if (!busy.start || !busy.end) return false;
          const bStart = new Date(busy.start).getTime();
          const bEnd = new Date(busy.end).getTime();
          return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
        });

        if (!hasOverlap && slotStart.getTime() > Date.now()) {
          available.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            display: `${slotStart.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })} at ${slotStart.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} IST`,
          });
        }
      }

      return {
        slots: available,
        isConnected: true,
        message: `Found ${available.length} available slots on Google Calendar.`,
      };
    } catch (err: unknown) {
      console.error("[GoogleCalendarService] checkAvailability error:", err);
      return {
        slots: [],
        isConnected: false,
        message: err instanceof Error ? err.message : "Error querying calendar availability",
      };
    }
  }

  /**
   * Create Google Calendar event with real Google Meet link
   */
  static async createBooking(params: {
    fullName: string;
    phone: string;
    email: string;
    startTime: string;
    endTime: string;
    timezone?: string;
    projectOverview?: string;
  }): Promise<BookingResult> {
    const calendar = this.getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    if (!calendar) {
      // Explicitly return pending status because credentials are not configured
      return {
        success: false,
        isMockedOrPending: true,
        message:
          "Google Calendar integration is not configured with live credentials. The consultation request has been captured as 'booking_pending' for human coordination.",
      };
    }

    try {
      const requestId = `meet-req-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      const response = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Studio Olives Cre Architectural Consultation: ${params.fullName}`,
          description: `VIP Client Architectural & Interior Consultation\n\nClient Name: ${params.fullName}\nPhone: ${params.phone}\nEmail: ${params.email}\nProject Details: ${params.projectOverview || "Luxury residential / commercial project"}\nArranged by Tisha (AI Voice Consultation Coordinator)`,
          start: {
            dateTime: params.startTime,
            timeZone: params.timezone || "Asia/Kolkata",
          },
          end: {
            dateTime: params.endTime,
            timeZone: params.timezone || "Asia/Kolkata",
          },
          attendees: [{ email: params.email, displayName: params.fullName }],
          conferenceData: {
            createRequest: {
              requestId,
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          },
        },
      });

      const event = response.data;
      const meetLink =
        event.conferenceData?.entryPoints?.find((ep) => ep.entryPointType === "video")?.uri ||
        event.hangoutLink;

      if (!meetLink) {
        return {
          success: false,
          isMockedOrPending: true,
          calendarEventId: event.id || undefined,
          message: "Calendar event was created but no Google Meet link was provisioned by Google.",
        };
      }

      return {
        success: true,
        isMockedOrPending: false,
        meetingUrl: meetLink,
        calendarEventId: event.id || undefined,
        message: `Meeting successfully confirmed with Google Meet link: ${meetLink}`,
      };
    } catch (err: unknown) {
      console.error("[GoogleCalendarService] createBooking error:", err);
      return {
        success: false,
        isMockedOrPending: true,
        message: err instanceof Error ? err.message : "Failed to create Google Calendar event",
      };
    }
  }
}
