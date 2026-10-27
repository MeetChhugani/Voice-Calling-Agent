import { z } from "zod";

export const LeadStatusEnum = z.enum([
  "new_lead",
  "qualifying",
  "qualified",
  "booking_pending",
  "booked",
  "not_qualified",
  "follow_up_required",
  "booking_failed",
]);
export type LeadStatus = z.infer<typeof LeadStatusEnum>;

export const MeetingStatusEnum = z.enum([
  "pending",
  "confirmed",
  "failed",
  "cancelled",
]);
export type MeetingStatus = z.infer<typeof MeetingStatusEnum>;

export const LeadSchema = z.object({
  id: z.string().optional(),
  full_name: z.string().min(1, "Name is required"),
  phone: z.string().min(8, "Phone is required"),
  phone_verified: z.boolean().default(false),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  property_city: z.string().optional().nullable(),
  property_location: z.string().optional().nullable(),
  property_type: z.string().optional().nullable(), // villa, apartment, penthouse, farmhouse, commercial
  project_status: z.string().optional().nullable(), // new construction, renovation, complete rebuild
  property_area: z.string().optional().nullable(),
  project_scope: z.string().optional().nullable(), // turnkey, architecture, interiors, construction, furnishing
  style_preferences: z.string().optional().nullable(),
  inspiration_notes: z.string().optional().nullable(),
  client_priorities: z.string().optional().nullable(),
  timeline: z.string().optional().nullable(),
  budget_fit: z.boolean().optional().nullable(),
  budget_notes: z.string().optional().nullable(),
  decision_makers: z.string().optional().nullable(),
  preferred_meeting_times: z.string().optional().nullable(),
  timezone: z.string().default("Asia/Kolkata"),
  consent_status: z.boolean().default(true),
  source: z.string().default("voice_agent_tisha"),
  call_summary: z.string().optional().nullable(),
  lead_status: LeadStatusEnum.default("new_lead"),
  internal_notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const MeetingSchema = z.object({
  id: z.string().optional(),
  lead_id: z.string(),
  calendar_event_id: z.string().optional().nullable(),
  meeting_url: z.string().url().optional().nullable(),
  start_time: z.string(),
  end_time: z.string(),
  timezone: z.string().default("Asia/Kolkata"),
  booking_status: MeetingStatusEnum.default("pending"),
  notes: z.string().optional().nullable(),
  created_at: z.string().optional(),
});
export type Meeting = z.infer<typeof MeetingSchema>;

// Tool input schemas for Vapi functions
export const CheckCalendarAvailabilityInputSchema = z.object({
  preferred_date: z.string().describe("Preferred date in YYYY-MM-DD format"),
  preferred_time_range: z
    .string()
    .optional()
    .describe("e.g. morning, afternoon, evening, or specific hour"),
  timezone: z.string().default("Asia/Kolkata"),
});
export type CheckCalendarAvailabilityInput = z.infer<
  typeof CheckCalendarAvailabilityInputSchema
>;

export const CreateGoogleMeetBookingInputSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(8),
  email: z.string().email(),
  slot_start_time: z.string().describe("ISO 8601 string e.g. 2026-10-15T15:00:00+05:30"),
  slot_end_time: z.string().describe("ISO 8601 string e.g. 2026-10-15T15:45:00+05:30"),
  timezone: z.string().default("Asia/Kolkata"),
  project_overview: z.string().optional(),
});
export type CreateGoogleMeetBookingInput = z.infer<
  typeof CreateGoogleMeetBookingInputSchema
>;

export const SaveLeadInputSchema = LeadSchema.partial().extend({
  full_name: z.string().min(1),
  phone: z.string().min(8),
});
export type SaveLeadInput = z.infer<typeof SaveLeadInputSchema>;
