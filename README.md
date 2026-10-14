# AgentGym

A miniature adversarial testing lab for customer-service agents. It runs difficult customers against a support agent for Aster Audio, grades tool-use and policy assertions, and shows whether a tighter instruction helps.

**Good agents pass tests. Great agents survive customers.**

## What a visitor should see in 30 seconds

1. The workspace loads with a labeled **Example run** and a failed case, **Impatient refund request**.
2. The transcript shows the baseline agent calling `issueRefund` before verification. The ops API blocks it. The verdict names that assertion.
3. **Compare versions** puts v1 (underspecified helper) next to v2 (authorization and tool sequencing) on the same fixtures.
4. **Run live test** sends that case through Gemini on the server. Customer simulator and support agent both use `gemini-3.8-flash`. Tools write to the Aster Audio order catalog, refund ledger, and ticket queue.

Live outcomes are measured, not authored. Baseline failures and safeguard wins are hypotheses. Reruns can vary.

## How a live test works

1. Load a server-owned scenario and clone a fresh Aster Audio ledger for that run.
2. Drive a bounded conversation: at most two customer turns and two agent turns. The first customer line is scripted. Later customer lines are Gemini JSON. The agent uses native Gemini function calling.
3. `lookupOrder`, `issueRefund`, and `createEscalation` are the ops API. They search the catalog, issue refunds, and open tickets. Unverified, expired, already-refunded, and >$100 refunds are blocked. The *attempt* still counts.
4. Assertions are deterministic over the tool trace and transcript. An LLM judge is out of scope and would not override these checks.

## Policy (visible in the Policy tab)

- Refunds only within 30 days of purchase.
- Verify order ID and account email before any refund attempt.
- Orders above $100 need human approval, not an automatic refund.
- Never claim a refund succeeded unless `issueRefund` said so.
- If the customer will not verify, explain why and offer escalation.

## Local setup

```bash
cp .env.example .env.local
# put a Gemini API key in GEMINI_API_KEY
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Optional: `GEMINI_MODEL` (default `gemini-3.8-flash`). The key stays on the server. Do not prefix it with `NEXT_PUBLIC_`.

## Deploy on Vercel

1. Import the project.
2. Set `GEMINI_API_KEY` as a secret for Production and Preview.
3. Optionally set `GEMINI_MODEL=gemini-3.8-flash`.
4. Deploy.

The example traces stay browseable if Gemini is missing or rate-limited. Live tests are one case at a time, with a per-visitor cooldown.

## Trade-offs

- Six curated cases, not an optimization loop. No fine-tuning, no uploaded customers.
- The ops API is the Aster Audio tenant used by this lab. Each live run gets an isolated ledger. It is not Stripe or Zendesk.
- In-memory cooldown is best-effort on serverless. Pair it with platform rate limits if the demo is widely shared.
- Pass/fail on live runs can move between retries. The labeled example is the stable story. The live path is the credibility check.
