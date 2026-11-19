import { NextResponse } from "next/server";
import { VAPI_ASSISTANT_CONFIG } from "@/config/dhruv-system-prompt";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
  const webhookUrl = process.env.VAPI_SERVER_URL;

  const assistantConfig = {
    ...VAPI_ASSISTANT_CONFIG,
    artifactPlan: {
      recordingEnabled: false,
      transcriptPlan: { enabled: true, assistantName: "Dhruv", userName: "Customer" },
    },
    ...(webhookUrl
      ? { server: { url: webhookUrl }, serverMessages: ["tool-calls", "end-of-call-report"] as const }
      : {}),
  };

  return NextResponse.json({
    hasPublicKey: Boolean(publicKey && !publicKey.includes("your_vapi_public_key")),
    hasAssistantId: Boolean(assistantId && !assistantId.includes("your_vapi_assistant_id")),
    assistantId: assistantId || null,
    // Provide the pre-configured assistant specification so client can use transient assistant if assistantId isn't provisioned
    assistantConfig,
  });
}
