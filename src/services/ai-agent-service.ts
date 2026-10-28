import { AIStructuredOutput, AIStructuredOutputSchema, WebhookPayload } from "@/types/workflow";

export interface AIAgentResult {
  success: boolean;
  structuredOutput?: AIStructuredOutput;
  rawText?: string;
  modelUsed: string;
  error?: string;
  isSimulated?: boolean;
}

export class AIAgentService {
  /**
   * System instruction enforcing structured JSON response
   */
  static getSystemPrompt(): string {
    return `You are the lead qualification AI Agent for Studio Olives Cre, an ultra-luxury architectural and interior design firm.
Your job is to analyze incoming client inquiries from webhooks and generate a structured JSON object.
CRITICAL RULES:
1. Always evaluate whether the client's budget aligns with Studio Olives Cre's ₹5 Crore starting threshold.
2. If budget mentions 5 Cr or more (e.g. 5 Cr, 6 Crore, 10 Cr), budget_qualified must be TRUE.
3. If budget is under 5 Cr or explicitly low, budget_qualified must be FALSE.
4. Output ONLY valid JSON matching this schema:
{
  "lead_name": string,
  "phone": string,
  "email": string,
  "property_type": string (e.g. Villa, Penthouse, Commercial),
  "project_scope": string (e.g. Turnkey Architecture & Interiors, Renovation),
  "estimated_budget_cr": number (in Crores INR, e.g. 6.0),
  "budget_qualified": boolean,
  "priority_level": "high" | "medium" | "low",
  "aesthetic_style": string (e.g. Contemporary Luxury, Warm Natural Stone),
  "summary": string,
  "recommended_action": string,
  "whatsapp_notification_text": string
}
Do NOT enclose in markdown backticks or any introductory text. Return raw JSON only.`;
  }

  /**
   * Run AI Agent on incoming webhook payload
   */
  static async processLead(
    payload: WebhookPayload,
    configModel?: string,
    allowSimulation: boolean = false
  ): Promise<AIAgentResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = configModel || process.env.OPENAI_MODEL || "gpt-4o";

    if (!apiKey || apiKey.includes("your_openai_api_key")) {
      if (allowSimulation) {
        return this.simulateStructuredLead(payload, model);
      }
      return {
        success: false,
        modelUsed: model,
        error: "OPENAI_API_KEY is not configured in the environment. Please add it to .env.local to execute the AI Agent node.",
      };
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: "system", content: this.getSystemPrompt() },
            {
              role: "user",
              content: `Analyze this prospective client inquiry:\nName: ${payload.name}\nPhone: ${payload.phone}\nEmail: ${payload.email || "N/A"}\nMessage: ${payload.message}\nProperty Type: ${payload.propertyType || "N/A"}\nBudget: ${payload.budget || "Not stated"}\nTimeline: ${payload.timeline || "N/A"}\nChannel: ${payload.channel}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          modelUsed: model,
          error: `OpenAI API returned status ${response.status}: ${errText}`,
        };
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content || "";

      // Structured Output Parser
      const parsedOutput = this.parseStructuredOutput(rawText);
      if (!parsedOutput.success) {
        return {
          success: false,
          rawText,
          modelUsed: model,
          error: parsedOutput.error,
        };
      }

      return {
        success: true,
        structuredOutput: parsedOutput.data,
        rawText,
        modelUsed: model,
      };
    } catch (err: unknown) {
      return {
        success: false,
        modelUsed: model,
        error: `AI Agent execution error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }

  /**
   * Deterministic local demonstration engine
   * Only executes when explicit simulation mode is enabled for live presentations
   */
  public static simulateStructuredLead(payload: WebhookPayload, model: string): AIAgentResult {
    const budgetMatch = (payload.budget || payload.message).match(/(\d+(\.\d+)?)/);
    const budgetVal = budgetMatch ? parseFloat(budgetMatch[1]) : 8.5;
    const isQualified = budgetVal >= 5.0;

    const property = payload.propertyType || "Luxury Villa";
    const name = payload.name || "Kabir Oberoi";
    const phone = payload.phone || "+919811223344";
    const email = payload.email || "kabir@oberoienterprises.in";

    const simulated: AIStructuredOutput = {
      lead_name: name,
      phone,
      email,
      property_type: property,
      project_scope: "Turnkey Architecture & Luxury Interiors",
      estimated_budget_cr: budgetVal,
      budget_qualified: isQualified,
      priority_level: isQualified ? "high" : "low",
      aesthetic_style: "Contemporary Luxury & Natural Stone Finishes",
      summary: `${property} inquiry with an estimated budget of ₹${budgetVal} Crore. ${
        isQualified ? "Meets Studio Olives Cre ₹5 Cr luxury qualification threshold." : "Below standard ₹5 Cr qualification threshold."
      }`,
      recommended_action: isQualified
        ? "Schedule direct online design consultation with senior partners."
        : "Refer to bespoke advisory catalog or follow up.",
      whatsapp_notification_text: `VIP Client Qualified: ${name} (${property}, ₹${budgetVal} Cr). Ready for partner review.`,
    };

    return {
      success: true,
      structuredOutput: simulated,
      rawText: JSON.stringify(simulated, null, 2),
      modelUsed: `${model} (Presentation Simulation Mode)`,
      isSimulated: true,
    };
  }

  /**
   * Validates & parses AI output against schema
   */
  static parseStructuredOutput(rawText: string): { success: boolean; data?: AIStructuredOutput; error?: string } {
    try {
      const cleaned = rawText
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      const json = JSON.parse(cleaned);
      const parsed = AIStructuredOutputSchema.safeParse(json);

      if (!parsed.success) {
        return {
          success: false,
          error: `Output parser failed: ${JSON.stringify(parsed.error.format())}`,
        };
      }

      return { success: true, data: parsed.data };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Structured output JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
