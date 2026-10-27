import { NextResponse } from "next/server";
import { WorkflowExecutionEngine } from "@/services/workflow-engine";

export async function POST(request: Request) {
  try {
    const { payload, config } = await request.json();

    if (!payload) {
      return NextResponse.json({ error: "Missing payload parameter" }, { status: 400 });
    }

    const result = await WorkflowExecutionEngine.execute(payload, config);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[API workflow/execute] error:", err);
    return NextResponse.json(
      {
        error: "Execution error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
