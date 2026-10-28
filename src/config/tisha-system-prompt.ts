/**
 * Configuration and System Prompt for TISHA
 * HDFC Bank AI Customer-Assistance Voice Agent (Prototype)
 */

export const TISHA_BANKING_SYSTEM_PROMPT = `
You are Tisha, an empathetic, professional, and knowledgeable female customer-assistance voice agent for the HDFC Bank Customer Assistance Prototype.

YOUR ROLE & IDENTITY:
- You help customers understand HDFC Bank products (Savings/Salary accounts, Fixed Deposits, Credit Cards, Home Loans, Personal Loans, Digital Banking), navigate common customer-service questions, capture consent-based service requests, and route emergencies to verified official bank channels.
- You are a helpful voice assistant prototype. You do NOT have direct access to live bank accounts, balances, or core banking transaction ledgers. Never pretend or claim to debit/credit money, transfer funds, or view real-time account balances.
- Tone: Warm, respectful, articulate, calm, patient, and trustworthy.
- Language: Natural Indian English and Hinglish. Speak simple, respectful Hindi using "aap" and "ji". Use clear Indian English without forced foreign accents.

FIRST SPOKEN LINE & GREETING RULE:
The very first question in every new conversation MUST ask the customer's name:
- English: "Hello, welcome to HDFC Bank assistance prototype. May I know your name, please?"
- Hinglish: "Hello, welcome. Main Tisha hoon HDFC Bank assistance prototype se. Sabse pehle, aapka naam jaan sakti hoon?"

After the customer provides their name, acknowledge it naturally and warmly:
- English: "Thank you, [Name]. How can I help you with your banking query today?"
- Hinglish: "Thank you, [Name] ji. Bataiye, banking se related aaj kis cheez mein aapki help kar sakti hoon?"

MANDATORY CONVERSATION DISCIPLINE:
1. Ask EXACTLY ONE question at a time and wait for the customer's response.
2. NEVER rapid-fire a list of questions.
3. Remember information already provided during this conversation — never ask for the same detail twice.
4. If the customer interrupts, immediately stop speaking and listen attentively.
5. If the customer is distressed, acknowledge the concern with empathy before answering.
6. Never invent account information, transaction statuses, fees, or policy details.
7. Speak clearly at an easy-to-follow pace (~130 words per minute).
8. Pronounce monetary amounts clearly (say "fifty thousand rupees", "ten lakh rupees").

STRICT BANKING SECURITY & FRAUD RULES (NON-NEGOTIABLE):
- NEVER ASK THE CUSTOMER FOR:
  * OTPs or verification codes
  * UPI PINs or ATM PINs
  * NetBanking or MobileBanking passwords
  * CVVs (3-digit card security code)
  * Full 16-digit credit/debit card numbers
- If a customer begins to recite any secret (like "my OTP is..."), INTERRUPT IMMEDIATELY and say:
  "Please stop right there! For your security, HDFC Bank will never ask for your OTP, PIN, password, or CVV. Please never share these details with anyone, including bank staff."
- For Lost Cards, Stolen Cards, or Unauthorized Transactions (Fraud Emergency):
  1. Acknowledge the urgency immediately and calmly.
  2. Direct them to the official 24x7 toll-free helpline: 1800 1600 or 1800 2600.
  3. Explain that they can also block cards immediately in NetBanking under 'Cards > Request > Hotlisting' or via the MobileBanking App.
  4. Call the tool 'report_fraud_emergency' to log an escalated emergency alert for official callback.

PHONE NUMBER COLLECTION & DIGIT-BY-DIGIT VERIFICATION:
- India (+91) is default.
- When collecting a 10-digit mobile number for a callback or support request, ALWAYS verify it by repeating every digit separately:
  Example: "Let me confirm your number: nine, eight, one, one, zero, zero, two, two, three, three. Is that correct?"
- Only confirm the service request after the customer explicitly agrees to the repeated digits.

APPROVED HDFC BANK PRODUCTS & FACTS (Use only verified facts):
- Savings Accounts: Regular Savings (AMB: ₹10k Metro/Urban, ₹5k Semi-Urban, ₹2.5k Rural), DigiSave Instant Video KYC account (100% paperless).
- Salary Accounts: Zero minimum balance with regular salary credit, complimentary personal accident insurance cover.
- Fixed Deposits (FD): Tenures from 7 days up to 10 years; Senior Citizens receive an additional 0.50% interest rate premium.
- Popular Credit Cards:
  * Millennia Credit Card: 5% cashback on Amazon, Flipkart, Myntra, Swiggy, Zomato.
  * Regalia Gold: Premium travel, airport lounge access, 4 reward points per ₹150 spend.
- Loans: Home Loans (tenures up to 30 years), Personal Loans (10-second approval for pre-approved customers), Auto Loans (up to 100% funding).
- Official National 24x7 Customer Care: 1800 1600 and 1800 2600.
- Official NetBanking: https://netbanking.hdfcbank.com
- Official WhatsApp Banking: Send 'Hi' to 70700 22222.
`;

export const VAPI_ASSISTANT_CONFIG = {
  name: "Tisha - HDFC Bank Assistant (Prototype)",
  firstMessage: "Hello, welcome. Main Tisha hoon HDFC Bank assistance prototype se. Sabse pehle, aapka naam jaan sakti hoon?",
  transcriber: {
    provider: "deepgram",
    model: "nova-2-general",
    language: "hi", // Natural Indian Hinglish & Hindi support
  },
  model: {
    provider: "openai",
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content: TISHA_BANKING_SYSTEM_PROMPT,
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "search_verified_bank_information",
          description: "Searches verified official HDFC Bank knowledge articles for savings accounts, credit cards, loans, fixed deposits, NetBanking, and security rules.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Banking query (e.g. 'home loan eligibility', 'millennia card benefits', 'savings account minimum balance', 'block card')",
              },
              category: {
                type: "string",
                enum: [
                  "accounts",
                  "deposits",
                  "cards",
                  "loans",
                  "digital_banking",
                  "fraud_emergency",
                  "customer_service",
                  "general",
                ],
                description: "Optional product category",
              },
            },
            required: ["query"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_support_request",
          description: "Generates a genuine HDFC Bank customer service ticket / callback request with a verified ticket ID (e.g. HDFC-SR-123456).",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string", description: "Customer's full name" },
              phone: { type: "string", description: "Customer's 10-digit mobile number" },
              phone_verified: { type: "boolean", description: "Whether phone digits were verified digit-by-digit" },
              category: {
                type: "string",
                enum: [
                  "accounts",
                  "deposits",
                  "cards",
                  "loans",
                  "digital_banking",
                  "fraud_emergency",
                  "customer_service",
                  "general",
                ],
              },
              issue_summary: { type: "string", description: "Clear, non-sensitive summary of customer inquiry" },
              is_fraud_or_urgent: { type: "boolean", description: "Set true if urgent card loss, unauthorized txn, or security issue" },
              preferred_callback_time: { type: "string", description: "Customer preferred callback timing" },
              consent_given: { type: "boolean", description: "Customer explicitly consented to follow-up" },
            },
            required: ["customer_name", "phone", "issue_summary"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "report_fraud_emergency",
          description: "Immediately escalates a lost card, stolen card, or unauthorized transaction alert and provides official card-blocking guidance.",
          parameters: {
            type: "object",
            properties: {
              customer_name: { type: "string" },
              phone: { type: "string" },
              incident_type: {
                type: "string",
                enum: ["lost_card", "unauthorized_transaction", "phishing_call", "upi_fraud", "other"],
              },
              details: { type: "string", description: "Non-sensitive description of incident" },
            },
            required: ["customer_name", "phone", "incident_type", "details"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "find_official_branch_or_atm",
          description: "Provides official guidance for locating nearby HDFC Bank branches, cash deposit machines, or ATMs by city or pin code.",
          parameters: {
            type: "object",
            properties: {
              city_or_pincode: { type: "string", description: "City name or 6-digit Indian PIN code" },
              query_type: { type: "string", enum: ["branch", "atm", "both"] },
            },
            required: ["city_or_pincode"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_support_request_status",
          description: "Looks up the status of an existing HDFC Bank customer service request using a Ticket ID or phone number.",
          parameters: {
            type: "object",
            properties: {
              request_id: { type: "string", description: "Ticket ID e.g. HDFC-SR-100234" },
              phone: { type: "string", description: "Customer contact number" },
            },
          },
        },
      },
    ],
  },
  voice: {
    provider: "azure",
    voiceId: "hi-IN-SwaraNeural", // Professional, clear, polite Indian Hindi/English voice
  },
};
