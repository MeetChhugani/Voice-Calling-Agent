import { createClient } from "@supabase/supabase-js";
import { Lead, Meeting, SaveLeadInput } from "@/types";

// In-memory fallback repository when Supabase credentials are not provided
class InMemoryStore {
  leads: Map<string, Lead> = new Map();
  meetings: Map<string, Meeting> = new Map();

  constructor() {
    // Seed sample data for immediate evaluation & testing
    const sampleLeadId = "lead-hardik-1";
    this.leads.set(sampleLeadId, {
      id: sampleLeadId,
      full_name: "Vikram Malhotra",
      phone: "+919811223344",
      phone_verified: true,
      email: "vikram@malhotragroup.in",
      property_city: "New Delhi",
      property_location: "Golf Links",
      property_type: "villa",
      project_status: "new construction",
      property_area: "12,000 sq ft",
      project_scope: "turnkey",
      style_preferences: "warm natural luxury with subtle brass and italian marble",
      inspiration_notes: "Hardik Pandya penthouse aesthetic with expansive courtyards",
      client_priorities: "craftsmanship and end-to-end execution",
      timeline: "Immediate (next month)",
      budget_fit: true,
      budget_notes: "Aligned with ₹5 Cr+ starting investment (budgeted ~₹12 Cr)",
      decision_makers: "Vikram & spouse",
      preferred_meeting_times: "Thursday afternoon",
      timezone: "Asia/Kolkata",
      consent_status: true,
      source: "voice_agent_dhruv",
      call_summary: "High intent prospective client looking for complete architectural and interior design for new 12,000 sq ft villa in Golf Links. Highly interested in our Naraina Vihar team's turnkey capabilities.",
      lead_status: "booked",
      internal_notes: "VIP consultation scheduled.",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      updated_at: new Date().toISOString(),
    });

    this.meetings.set("meet-1", {
      id: "meet-1",
      lead_id: sampleLeadId,
      calendar_event_id: "cal-sample-123",
      meeting_url: "https://meet.google.com/abc-defg-hij",
      start_time: new Date(Date.now() + 86400000 * 2).toISOString(),
      end_time: new Date(Date.now() + 86400000 * 2 + 2700000).toISOString(),
      timezone: "Asia/Kolkata",
      booking_status: "confirmed",
      notes: "Initial online concept walkthrough with Senior Partner",
      created_at: new Date().toISOString(),
    });
  }
}

const memoryStore = new InMemoryStore();

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes("your-project.supabase.co")) {
    return null;
  }
  return createClient(url, key);
}

export class SupabaseService {
  /**
   * Save or update lead details
   */
  static async saveOrUpdateLead(leadInput: SaveLeadInput): Promise<{ success: boolean; lead: Lead; isFallback: boolean }> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    if (!supabase) {
      // Use in-memory store
      let existing = Array.from(memoryStore.leads.values()).find(
        (l) => l.phone === leadInput.phone || (leadInput.email && l.email === leadInput.email)
      );

      const leadId = existing?.id || leadInput.id || `lead-${Date.now()}`;
      const updatedLead: Lead = {
        ...existing,
        ...leadInput,
        id: leadId,
        created_at: existing?.created_at || now,
        updated_at: now,
        lead_status: leadInput.lead_status || existing?.lead_status || "qualifying",
        timezone: leadInput.timezone || "Asia/Kolkata",
        phone_verified: leadInput.phone_verified ?? existing?.phone_verified ?? false,
        consent_status: true,
        source: "voice_agent_dhruv",
      };

      memoryStore.leads.set(leadId, updatedLead);
      return { success: true, lead: updatedLead, isFallback: true };
    }

    try {
      // Find existing by phone
      let { data: existing } = await supabase
        .from("leads")
        .select("*")
        .eq("phone", leadInput.phone)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("leads")
          .update({
            ...leadInput,
            updated_at: now,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return { success: true, lead: data as Lead, isFallback: false };
      } else {
        const { data, error } = await supabase
          .from("leads")
          .insert({
            ...leadInput,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, lead: data as Lead, isFallback: false };
      }
    } catch (err) {
      console.error("[SupabaseService] saveOrUpdateLead error, falling back to memory:", err);
      const fallbackId = `lead-${Date.now()}`;
      const fallbackLead: Lead = {
        ...leadInput,
        id: fallbackId,
        created_at: now,
        updated_at: now,
        lead_status: leadInput.lead_status || "qualifying",
        timezone: leadInput.timezone || "Asia/Kolkata",
        phone_verified: leadInput.phone_verified ?? false,
        consent_status: true,
        source: "voice_agent_dhruv",
      };
      memoryStore.leads.set(fallbackId, fallbackLead);
      return { success: true, lead: fallbackLead, isFallback: true };
    }
  }

  /**
   * Save meeting booking record
   */
  static async saveMeeting(meeting: Omit<Meeting, "id" | "created_at">): Promise<{ success: boolean; meeting: Meeting; isFallback: boolean }> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const id = `meet-${Date.now()}`;

    if (!supabase) {
      const newMeeting: Meeting = {
        ...meeting,
        id,
        created_at: now,
      };
      memoryStore.meetings.set(id, newMeeting);

      // Update lead status to booked if confirmed
      if (meeting.lead_id && memoryStore.leads.has(meeting.lead_id)) {
        const lead = memoryStore.leads.get(meeting.lead_id)!;
        lead.lead_status = meeting.booking_status === "confirmed" ? "booked" : "booking_pending";
        lead.updated_at = now;
      }

      return { success: true, meeting: newMeeting, isFallback: true };
    }

    try {
      const { data, error } = await supabase
        .from("meetings")
        .insert({
          ...meeting,
          created_at: now,
        })
        .select()
        .single();

      if (error) throw error;

      // Also update lead status
      if (meeting.lead_id) {
        await supabase
          .from("leads")
          .update({
            lead_status: meeting.booking_status === "confirmed" ? "booked" : "booking_pending",
            updated_at: now,
          })
          .eq("id", meeting.lead_id);
      }

      return { success: true, meeting: data as Meeting, isFallback: false };
    } catch (err) {
      console.error("[SupabaseService] saveMeeting error, falling back to memory:", err);
      const fallbackMeeting: Meeting = { ...meeting, id, created_at: now };
      memoryStore.meetings.set(id, fallbackMeeting);
      return { success: true, meeting: fallbackMeeting, isFallback: true };
    }
  }

  /**
   * Get all leads for admin dashboard
   */
  static async getAllLeads(): Promise<{ leads: Lead[]; isFallback: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const list = Array.from(memoryStore.leads.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      return { leads: list, isFallback: true };
    }

    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { leads: (data as Lead[]) || [], isFallback: false };
    } catch (err) {
      console.error("[SupabaseService] getAllLeads error, using memory:", err);
      return { leads: Array.from(memoryStore.leads.values()), isFallback: true };
    }
  }

  /**
   * Get all meetings
   */
  static async getAllMeetings(): Promise<{ meetings: Meeting[]; isFallback: boolean }> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      const list = Array.from(memoryStore.meetings.values()).sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      return { meetings: list, isFallback: true };
    }

    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { meetings: (data as Meeting[]) || [], isFallback: false };
    } catch (err) {
      console.error("[SupabaseService] getAllMeetings error, using memory:", err);
      return { meetings: Array.from(memoryStore.meetings.values()), isFallback: true };
    }
  }
}
