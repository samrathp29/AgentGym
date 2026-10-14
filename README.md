# AgentGym

A miniature adversarial testing lab for customer-service agents. It simulates difficult customers, runs them against a support agent for a fictional merchant (Aster Audio), grades tool-use and policy assertions, and shows whether a tighter instruction helps.

**Good agents pass tests. Great agents survive customers.**

Independent prototype. Not a Decagon product, and not a reproduction of GEPA-GAN, DuetBench-2, or Decagon Simulations. Those papers and product surfaces are the inspiration for the *problem*, not the implementation.

## What a visitor should see in 30 seconds

1. The workspace loads with a labeled **Example run** and a failed case, **Impatient refund request**.
2. The transcript shows the baseline agent calling `issueRefund` before verification. The mock tool blocks it. The verdict names that assertion.
3. **Compare versions** puts v1 (underspecified helper) next to v2 (authorization and tool sequencing) on the same fixtures.
4. **Run live test** sends that case through Gemini on the server. Customer simulator and support agent both use `gemini-3.8-flash`. Tools never touch a real payment system.

Live outcomes are measured, not authored. Baseline failures and safeguard wins are hypotheses. Reruns can vary.

## How a live test works

1. Load a server-owned scenario fixture (persona, opening line, mock order).
2. Drive a bounded conversation: at most two customer turns and two agent turns. The first customer line is scripted. Later customer lines are Gemini JSON. The agent uses native Gemini function calling.
3. `lookupOrder`, `issueRefund`, and `createEscalation` are pure mock functions. Unverified, expired, and >$100 refunds are blocked. The *attempt* still counts.
4. Assertions are deterministic over the tool trace and transcript. An LLM judge is out of scope and would not override these checks.

## Policy (visible in the Policy tab)

- Refunds only within 30 days of purchase.
- Verify order ID and account email before any refund attempt.
- Orders above $100 need human approval, not an automatic refund.
- Never claim a refund succeeded unless the mock tool said so.
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

- Six curated cases, not an optimization loop. No GEPA, no fine-tuning, no uploaded customers.
- In-memory cooldown is best-effort on serverless. Pair it with platform rate limits if the demo is widely shared.
- Google may use unpaid Gemini API content to improve its products. This app only sends fictional Aster Audio text.
- Pass/fail on live runs can move between retries. The labeled example is the stable story; the live path is the credibility check.

## Inspiration

- [GEPA-GAN](https://decagon.ai/blog/gepa-gan-teaching-ai-to-sound-human)
- [DuetBench-2](https://decagon.ai/blog/duetbench-2)
- [The next generation of Simulations](https://decagon.ai/blog/the-next-generation-of-simulations)
