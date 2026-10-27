import { NextResponse } from "next/server";
import { SaveLeadInputSchema } from "@/types";
import { SupabaseService } from "@/services/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = SaveLeadInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid lead payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await SupabaseService.saveOrUpdateLead(parsed.data);

    return NextResponse.json({
      success: true,
      lead: result.lead,
      isFallback: result.isFallback,
    });
  } catch (err: unknown) {
    console.error("[API leads/save] error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
