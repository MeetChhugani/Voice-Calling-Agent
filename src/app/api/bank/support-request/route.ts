import { NextResponse } from "next/server";
import { SupportRequestService } from "@/services/support-request-service";
import { CreateSupportRequestInputSchema } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateSupportRequestInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
    }
    const result = await SupportRequestService.createRequest({
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      phone_verified: parsed.data.phone_verified,
      email: parsed.data.email,
      category: parsed.data.category,
      product_type: parsed.data.product_type,
      issue_summary: parsed.data.issue_summary,
      preferred_callback_time: parsed.data.preferred_callback_time,
      consent_given: parsed.data.consent_given,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const all = await SupportRequestService.getAllRequests();
  return NextResponse.json({ requests: all, total: all.length });
}
