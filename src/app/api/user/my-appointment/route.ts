import { NextResponse } from "next/server";
import { SupportRequestService } from "@/services/support-request-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone") || "";
  const ticket = searchParams.get("ticket") || "";
  const query = ticket || phone;

  if (!query) {
    return NextResponse.json(
      { error: "Please provide 'phone' or 'ticket' parameter." },
      { status: 400 }
    );
  }

  const results = await SupportRequestService.findByTicketOrPhoneAsync(query);
  return NextResponse.json({
    found: results.length > 0,
    requests: results,
    total: results.length,
  });
}
