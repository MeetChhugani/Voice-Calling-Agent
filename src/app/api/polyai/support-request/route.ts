import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { CreateSupportRequestInputSchema } from "@/types";
import { SupportRequestService } from "@/services/support-request-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request, secret: string): boolean {
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);

  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getConversationId(body: Record<string, unknown>, args: Record<string, unknown>) {
  const metadata = asObject(body.metadata);
  const rawId =
    body.conversation_id ??
    body.call_id ??
    metadata?.conversation_id ??
    args.conversation_id ??
    args.call_id;

  if (typeof rawId !== "string") return null;
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 120);
  return safeId || null;
}

export async function POST(request: Request) {
  const secret = process.env.POLYAI_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "PolyAI integration is not configured on this server." },
      { status: 503 }
    );
  }

  if (!authorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = asObject(await request.json());
    if (!body) {
      return NextResponse.json({ error: "Expected a JSON object." }, { status: 400 });
    }

    let rawArgs: unknown = body.arguments ?? body.parameters ?? body.input ?? body;
    if (typeof rawArgs === "string") {
      try {
        rawArgs = JSON.parse(rawArgs);
      } catch {
        return NextResponse.json({ error: "Function arguments must be valid JSON." }, { status: 400 });
      }
    }

    const args = asObject(rawArgs);
    if (!args) {
      return NextResponse.json({ error: "Expected support request fields." }, { status: 400 });
    }
    if (args.consent_given !== true) {
      return NextResponse.json(
        { error: "Explicit customer consent is required before creating a support request." },
        { status: 400 }
      );
    }

    const parsed = CreateSupportRequestInputSchema.safeParse(args);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid support request fields.", fields: parsed.error.issues.map((issue) => issue.path.join(".")) },
        { status: 400 }
      );
    }

    const conversationId = getConversationId(body, args);
    const duplicate = conversationId
      ? (await SupportRequestService.getAllRequests()).find((item) =>
          item.agent_notes?.includes(`[PolyAI conversation ${conversationId}]`)
        )
      : undefined;

    if (duplicate) {
      return NextResponse.json(
        { success: true, duplicate: true, ticket_id: duplicate.id, status: duplicate.status },
        { status: 200 }
      );
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
      agent_notes: conversationId ? `[PolyAI conversation ${conversationId}]` : null,
    });

    return NextResponse.json(
      {
        success: true,
        ticket_id: result.ticket.id,
        status: result.ticket.status,
        message: `Customer service request ${result.ticket.id} is now in the staff dashboard.`,
        warning: result.warning,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PolyAI support request] Failed to process request:", error);
    return NextResponse.json({ error: "Unable to create the support request." }, { status: 500 });
  }
}
