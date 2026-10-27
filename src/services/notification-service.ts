import { NotificationChannel } from "@/types/workflow";

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  recipient: string;
  messageBody: string;
  isDryRun: boolean;
  provider: "twilio" | "console_dry_run" | "unconfigured";
  messageSid?: string;
  status: "delivered" | "dry_run_preview" | "failed";
  message: string;
}

export class NotificationService {
  /**
   * Send an SMS or WhatsApp notification, or perform a clearly labelled dry-run preview
   */
  static async sendNotification(params: {
    channel: NotificationChannel;
    recipient: string;
    messageBody: string;
    dryRun?: boolean;
  }): Promise<NotificationResult> {
    const { channel, recipient, messageBody, dryRun = true } = params;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone =
      channel === "whatsapp"
        ? process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
        : process.env.TWILIO_PHONE_NUMBER || "+15005550006";

    const hasRealCredentials = Boolean(
      accountSid &&
        authToken &&
        !accountSid.includes("your_") &&
        !authToken.includes("your_")
    );

    // If dryRun requested OR real credentials not provided
    if (dryRun || !hasRealCredentials) {
      const modeReason = dryRun
        ? "Explicit dry-run enabled"
        : "Twilio credentials not configured in environment";

      return {
        success: true,
        channel,
        recipient,
        messageBody,
        isDryRun: true,
        provider: "console_dry_run",
        messageSid: `dry-run-${Date.now()}`,
        status: "dry_run_preview",
        message: `[DRY-RUN PREVIEW] (${modeReason}) Would send ${channel.toUpperCase()} to ${recipient}: "${messageBody}"`,
      };
    }

    // Real sending via Twilio SDK
    try {
      const twilioModule = await import("twilio");
      const client = twilioModule.default(accountSid, authToken);

      const toTarget =
        channel === "whatsapp" && !recipient.startsWith("whatsapp:")
          ? `whatsapp:${recipient}`
          : recipient;

      const fromTarget =
        channel === "whatsapp" && !fromPhone.startsWith("whatsapp:")
          ? `whatsapp:${fromPhone}`
          : fromPhone;

      const res = await client.messages.create({
        body: messageBody,
        from: fromTarget,
        to: toTarget,
      });

      return {
        success: true,
        channel,
        recipient,
        messageBody,
        isDryRun: false,
        provider: "twilio",
        messageSid: res.sid,
        status: "delivered",
        message: `Successfully dispatched real ${channel.toUpperCase()} message via Twilio (SID: ${res.sid})`,
      };
    } catch (err: unknown) {
      return {
        success: false,
        channel,
        recipient,
        messageBody,
        isDryRun: false,
        provider: "twilio",
        status: "failed",
        message: `Twilio delivery failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
