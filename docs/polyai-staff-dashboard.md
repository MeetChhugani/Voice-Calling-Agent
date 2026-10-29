# Connect PolyAI calls to Customer Service Requests

This app receives a support request when the PolyAI agent invokes a Studio function. The endpoint adds a ticket to the same request store used by the staff dashboard:

```text
POST https://<your-deployed-app>/api/polyai/support-request
Authorization: Bearer <POLYAI_WEBHOOK_SECRET>
Content-Type: application/json
```

## Configure the app

1. Deploy the app to a public HTTPS URL. PolyAI cannot call a `localhost` address.
2. Set `POLYAI_WEBHOOK_SECRET` in the app’s server environment to a long random value. Do not expose it as a `NEXT_PUBLIC_` variable or send it in chat.
3. Apply `supabase/migrations/20261029000000_support_requests.sql` to the configured Supabase project and set `SUPABASE_SERVICE_ROLE_KEY` in the app’s server environment. This makes requests durable across serverless instances and visible to the staff dashboard.
4. Restart or redeploy the app so the server picks up the secrets.

## Configure the PolyAI Studio function

Add an API-calling function/tool to the published agent for the moment it has collected a customer’s explicit consent and the details needed to open a service request. Configure it to POST to the endpoint above and set the authorization header from a PolyAI Secret holding the same value. Map these fields into the JSON body:

```json
{
  "customer_name": "customer's name",
  "phone": "+919876543210",
  "phone_verified": true,
  "email": "customer@example.com",
  "category": "customer_service",
  "product_type": "credit card",
  "issue_summary": "Short summary of the requested assistance",
  "preferred_callback_time": "Tomorrow morning",
  "consent_given": true,
  "conversation_id": "PolyAI conversation identifier"
}
```

Required fields are `customer_name`, `phone`, `issue_summary`, and `consent_given: true`. `email`, `category`, `product_type`, `preferred_callback_time`, and `phone_verified` are optional. Use one of the app’s categories: `accounts`, `deposits`, `cards`, `loans`, `digital_banking`, `fraud_emergency`, `customer_service`, or `general`.

Use the returned `ticket_id` and `status` in the agent’s spoken confirmation. Repeated requests with the same `conversation_id` return the existing ticket rather than making a second one.

The function should run when a customer requests a callback, reports an issue that needs staff follow-up, or asks to open a service request. It does not create a staff ticket for every caller automatically. If every PolyAI call and transcript must be logged even when no request is opened, configure PolyAI call-data export or its Conversations API separately and add the appropriate PolyAI credentials to the server; a request-creation function does not provide a complete call log.

Do not ask callers for or send OTPs, PINs, CVVs, passwords, full card numbers, or account credentials through this function. The dashboard entry is created only after the agent has the caller’s consent and a callback phone number.

For Hindi and multilingual voice recognition settings, configure the agent in PolyAI Studio and contact your PolyAI representative if the required ASR language model is not available in your self-service settings.
