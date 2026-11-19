import { createClient } from "@supabase/supabase-js";
import { SecurityRedactionService } from "@/services/security-redaction-service";

export interface VoiceCallTranscriptRecord {
  call_id: string;
  call_type: string | null;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  account_last4: string | null;
  support_request_id: string | null;
  transcript: string;
  summary: string | null;
  ended_reason: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

const memoryReports = new Map<string, VoiceCallTranscriptRecord>();

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("your-project.supabase.co")) return null;
  return createClient(url, key);
}

export class VoiceCallService {
  static async saveTranscript(input: Omit<VoiceCallTranscriptRecord, "created_at">) {
    const record: VoiceCallTranscriptRecord = {
      ...input,
      transcript: SecurityRedactionService.sanitizeTranscript(input.transcript).redactedText,
      summary: input.summary
        ? SecurityRedactionService.sanitizeTranscript(input.summary).redactedText
        : null,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (!supabase) {
      memoryReports.set(record.call_id, record);
      return { record, isFallback: true };
    }

    const { data: relatedRequest } = await supabase
      .from("support_requests")
      .select("id, customer_name, phone, email, account_last4")
      .eq("call_id", record.call_id)
      .maybeSingle();

    const enrichedRecord = relatedRequest
      ? {
          ...record,
          customer_name: relatedRequest.customer_name || record.customer_name,
          phone: relatedRequest.phone || record.phone,
          email: relatedRequest.email || null,
          account_last4: relatedRequest.account_last4 || null,
          support_request_id: relatedRequest.id || null,
        }
      : record;

    const { data, error } = await supabase
      .from("voice_call_transcripts")
      .upsert(enrichedRecord, { onConflict: "call_id" })
      .select()
      .single();
    if (error) throw error;
    return { record: data as VoiceCallTranscriptRecord, isFallback: false };
  }

  static async getAllTranscripts(): Promise<VoiceCallTranscriptRecord[]> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return [...memoryReports.values()].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    const { data, error } = await supabase
      .from("voice_call_transcripts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []) as VoiceCallTranscriptRecord[];
  }
}
