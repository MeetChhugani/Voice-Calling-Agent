import { NextResponse } from "next/server";
import { WorkflowExecutionEngine } from "@/services/workflow-engine";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const result = await WorkflowExecutionEngine.execute(rawBody);

    const status = result.status === "failed" ? 400 : 200;
    return NextResponse.json(result, { status });
  } catch (err: unknown) {
    console.error("[API workflow/webhook] error:", err);
    return NextResponse.json(
      {
        error: "Webhook execution failed",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
