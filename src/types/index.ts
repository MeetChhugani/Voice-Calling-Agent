import { z } from "zod";

// ─── HDFC Bank Enquiry & Support Types ───────────────────────────────────────
export const BankingCategoryEnum = z.enum([
  "accounts",           // Savings, Current, Salary, 3-in-1, Digital Accounts
  "deposits",           // Fixed Deposits, Recurring Deposits
  "cards",              // Credit Cards, Debit Cards, Forex Cards
  "loans",              // Home Loan, Personal Loan, Auto/Car, Business, Gold Loan
  "digital_banking",    // NetBanking, MobileBanking, PayZapp, UPI
  "fraud_emergency",    // Lost Card, Unauthorized Txn, Phishing, Card Block
  "customer_service",   // Statement, Cheque Book, Profile Update, Complaints
  "general",            // Branch/ATM timing, Holidays, General Information
]);
export type BankingCategory = z.infer<typeof BankingCategoryEnum>;

export const SupportRequestStatusEnum = z.enum([
  "registered",
  "assigned",
  "in_progress",
  "escalated",
  "resolved",
]);
export type SupportRequestStatus = z.infer<typeof SupportRequestStatusEnum>;

export const SupportRequestSchema = z.object({
  id: z.string().describe("Unique Ticket ID e.g. HDFC-SR-123456"),
  customer_name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(8, "Valid contact number required"),
  phone_verified: z.boolean().default(false),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  category: BankingCategoryEnum.default("general"),
  product_type: z.string().optional().nullable(), // e.g. "Salary Account", "Home Loan", "Regalia Gold Card"
  issue_summary: z.string().min(1, "Issue or inquiry description"),
  is_fraud_or_urgent: z.boolean().default(false),
  preferred_callback_time: z.string().optional().nullable(),
  consent_given: z.boolean().default(true),
  status: SupportRequestStatusEnum.default("registered"),
  official_reference_channel: z.string().default("HDFC Bank Official Customer Care (1800 1600)"),
  agent_notes: z.string().optional().nullable(),
  created_at: z.string().default(() => new Date().toISOString()),
  updated_at: z.string().optional(),
});
export type SupportRequest = z.infer<typeof SupportRequestSchema>;

// ─── Legacy / Compatibility Models (retained to preserve existing database & engine) ──
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
  property_type: z.string().optional().nullable(),
  project_status: z.string().optional().nullable(),
  property_area: z.string().optional().nullable(),
  project_scope: z.string().optional().nullable(),
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

// ─── Vapi Tool Input Schemas for HDFC Bank Agent ─────────────────────────────

export const SearchBankInfoInputSchema = z.object({
  query: z.string().describe("Specific banking product or service query (e.g. 'home loan interest rates', 'savings account minimum balance', 'block credit card')"),
  category: BankingCategoryEnum.optional().describe("Optional product category to narrow search"),
});
export type SearchBankInfoInput = z.infer<typeof SearchBankInfoInputSchema>;

export const CreateSupportRequestInputSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  phone: z.string().min(8, "Customer phone number is required"),
  phone_verified: z.boolean().default(false).describe("Whether phone digits were verified digit-by-digit with the customer"),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  product_type: z.string().optional().nullable(),
  category: BankingCategoryEnum.default("general").describe("Banking category for the query"),
  issue_summary: z.string().describe("Short, clear summary of the customer's request or issue"),
  is_fraud_or_urgent: z.boolean().default(false).describe("True if customer reports card loss, unauthorized txn, or security emergency"),
  preferred_callback_time: z.string().optional().nullable().describe("e.g. 'Today afternoon', 'Tomorrow 11 AM'"),
  consent_given: z.boolean().default(true).describe("Customer explicitly agreed to bank follow-up"),
});
export type CreateSupportRequestInput = z.infer<typeof CreateSupportRequestInputSchema>;

export const ReportFraudEmergencyInputSchema = z.object({
  customer_name: z.string().min(1),
  phone: z.string().min(8),
  incident_type: z.enum(["lost_card", "unauthorized_transaction", "phishing_call", "upi_fraud", "other"]),
  details: z.string().describe("Short non-sensitive description. NEVER include OTP, PIN, CVV, or card password!"),
});
export type ReportFraudEmergencyInput = z.infer<typeof ReportFraudEmergencyInputSchema>;

export const FindBranchAtmInputSchema = z.object({
  city_or_pincode: z.string().describe("City name, area, or 6-digit Indian PIN code (e.g. 'Mumbai', 'Connaught Place Delhi', '560001')"),
  query_type: z.enum(["branch", "atm", "both"]).default("both"),
});
export type FindBranchAtmInput = z.infer<typeof FindBranchAtmInputSchema>;

export const GetSupportRequestStatusInputSchema = z.object({
  request_id: z.string().optional().describe("Ticket ID e.g. HDFC-SR-123456"),
  phone: z.string().optional().describe("Customer phone number"),
});
export type GetSupportRequestStatusInput = z.infer<typeof GetSupportRequestStatusInputSchema>;

// Tool input schemas for compatibility
export const CheckCalendarAvailabilityInputSchema = z.object({
  preferred_date: z.string().describe("Preferred date in YYYY-MM-DD format"),
  preferred_time_range: z.string().optional(),
  timezone: z.string().default("Asia/Kolkata"),
});
export type CheckCalendarAvailabilityInput = z.infer<typeof CheckCalendarAvailabilityInputSchema>;

export const CreateGoogleMeetBookingInputSchema = z.object({
  full_name: z.string().min(1),
  phone: z.string().min(8),
  email: z.string().email(),
  slot_start_time: z.string(),
  slot_end_time: z.string(),
  timezone: z.string().default("Asia/Kolkata"),
  project_overview: z.string().optional(),
});
export type CreateGoogleMeetBookingInput = z.infer<typeof CreateGoogleMeetBookingInputSchema>;

export const SaveLeadInputSchema = LeadSchema.partial().extend({
  full_name: z.string().min(1),
  phone: z.string().min(8),
});
export type SaveLeadInput = z.infer<typeof SaveLeadInputSchema>;
