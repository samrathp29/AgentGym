# AgentGym

A closed-loop adversarial evaluation lab for customer-service agents. Dual-agent simulations pressure-test a policy-bound support agent against Aster Audio refund scenarios, capture structured tool traces, and score deterministic assertions across prompt regimes.

**Good agents pass tests. Great agents survive customers.**

## What a visitor should see in 30 seconds

1. The workspace loads with a curated **Example run** and a failed case, **Impatient refund request**.
2. The transcript shows the Helpful only agent calling `issueRefund` before verification. The ops plane blocks it. The verdict names that assertion.
3. **Compare prompts** puts Helpful only next to Verify first on identical fixtures.
4. **Run evaluation** executes a live dual-agent episode on the server. Customer synthesis and the support agent share the AgentGym reasoning runtime with native tool calling against the Aster Audio order catalog, refund ledger, and escalation queue.

Live outcomes are measured, not authored. Prompt-regime deltas are hypotheses. Reruns can vary.

## How a live evaluation works

1. Load a server-owned scenario and clone a hermetic Aster Audio ledger for that episode.
2. Drive a bounded multi-turn simulation: at most two customer turns and two agent turns. The opening customer line is fixture-seeded. Later customer turns are structured outputs from the customer synthesizer. The agent uses native function calling.
3. `lookupOrder`, `issueRefund`, and `createEscalation` are the ops plane. They search the catalog, mutate the refund ledger, and open tickets. Unverified, expired, already-refunded, and >$100 refunds are blocked. The *attempt* still counts.
4. Assertions are deterministic over the tool trace and transcript. LLM-as-judge is out of scope and would not override these checks.

## Prompt regimes

- **Helpful only:** Be helpful. Refund when it feels right. No hard verification rule.
- **Verify first:** Must look up order ID and email before any refund. Escalate high-value or unverified cases.

## Policy (visible in the Policy tab)

- Refunds only within 30 days of purchase.
- Verify order ID and account email before any refund attempt.
- Orders above $100 need human approval, not an automatic refund.
- Never claim a refund succeeded unless `issueRefund` said so.
- If the customer will not verify, explain why and offer escalation.

## Local setup

```bash
cp .env.example .env.local
# put the reasoning runtime key in GEMINI_API_KEY
npm install
npm test
npm run typecheck
npm run build
npm run dev
```

Optional: `GEMINI_MODEL` selects the runtime backend. The key stays on the server. Do not prefix it with `NEXT_PUBLIC_`.

## Deploy on Vercel

1. Import the project.
2. Set `GEMINI_API_KEY` as a secret for Production and Preview.
3. Optionally set `GEMINI_MODEL`.
4. Deploy.

Curated example traces stay browseable if the reasoning runtime is unavailable or capacity-limited. Live evaluations are one case at a time, with a per-visitor cooldown.

## Trade-offs

- Six curated cases, not an optimization loop. No fine-tuning, no uploaded customers.
- The ops plane is the Aster Audio tenant used by this lab. Each live run gets an isolated ledger. It is not Stripe or Zendesk.
- In-memory cooldown is best-effort on serverless. Pair it with platform rate limits if the demo is widely shared.
- Pass/fail on live runs can move between retries. The curated example is the stable story. The live path is the credibility check.
