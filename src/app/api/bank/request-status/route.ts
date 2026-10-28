import { NextResponse } from "next/server";
import { SupportRequestService } from "@/services/support-request-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || searchParams.get("ticket") || searchParams.get("phone") || "";
  if (!query) {
    return NextResponse.json({ error: "Provide 'q' param with ticket ID or phone number." }, { status: 400 });
  }
  const results = SupportRequestService.findByTicketOrPhone(query);
  return NextResponse.json({ found: results.length > 0, requests: results, total: results.length });
}
