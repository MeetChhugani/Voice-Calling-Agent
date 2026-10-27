import { NextResponse } from "next/server";
import { CheckCalendarAvailabilityInputSchema } from "@/types";
import { GoogleCalendarService } from "@/services/google-calendar";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CheckCalendarAvailabilityInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { preferred_date, preferred_time_range, timezone } = parsed.data;
    const result = await GoogleCalendarService.checkAvailability(
      preferred_date,
      preferred_time_range,
      timezone
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[API check-availability] error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
