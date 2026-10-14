# AgentGym — MVP Product & Technical Specification

**Version:** 1.1 | **Target:** A polished, recruiter-ready Vercel demo with working Gemini-powered evaluations on first deployment | **Build mode:** One integrated end-to-end implementation with Cursor / Claude Code

## 1. Product thesis

**AgentGym** is a miniature adversarial testing lab for customer-service AI agents. It simulates difficult customers, runs their conversations against a support agent, evaluates concrete policy and tool-use assertions, and shows whether a small guardrail change improves the outcome.

**One-line pitch:** *Good agents pass tests. Great agents survive customers.*

Inspired by Decagon's research on realistic synthetic customers (GEPA-GAN), its DuetBench-2 work on trustworthy agent evaluation, and its emphasis on transparent simulation checkpoints. This is an **independent prototype, not a Decagon product or a reproduction of its underlying systems**.

### Product outcome

Within **30 seconds**, a first-time visitor should understand: (1) what the agent is supposed to do, (2) how an adversarial customer breaks it, (3) which exact assertion failed, and (4) how a revised instruction performs on the same test.

### User persona

A Decagon recruiter or engineer opening a link for 1–3 minutes, without signing up, installing anything, or bringing an API key.

## 2. Golden-path experience

1. **Land.** A concise atmospheric hero says *"Good agents pass tests. Great agents survive customers."* Subtext: *"Stress-test a support agent with difficult customers. Trace failures. Validate fixes."* The primary CTA is **Explore the lab**; secondary CTA **How it works**.
2. **See a ready-to-explore result.** The workspace opens immediately with **Example run · Sample data** (clearly labeled) showing six realistic test cases and a highlighted failed test. Zero loading screen, zero setup.
3. **Investigate.** Click the failed test, **Impatient refund request**. An animated chat transcript appears with a customer insisting on a refund despite missing verification. The trace pinpoints the agent's attempted `issueRefund` call, with the mock tool blocking it, and marks **Failed: attempted refund before verification**.
4. **Apply the proposed safeguard.** A short side-by-side policy diff shows that v2 explicitly requires completed verification before attempting a refund. Click **Compare versions** to inspect baseline and safeguarded example results.
5. **Verify for real.** Click **Run live test** on a single selected case. **Gemini runs the actual customer simulation and support agent**, with mock tool execution and deterministic assertions on the server. The app returns the real transcript, trace, policy verdict, execution time, and model label. Visitors can rerun the same case with v1 and v2; outcomes are measured, not predetermined. **The live path is implemented and tested in the initial build, not added in a second phase.**
6. **Share.** **Copy result summary** creates a small text summary of the measured run. A **About this experiment** panel explains limitations and links to the inspiration.

**Design principle:** The value is visible before any action, and the live run is genuinely functional from launch. The preloaded example is a UX choice and a free-tier fallback—not a substitute for building the evaluation backend.

## 3. Scope: precisely one believable domain

Use a fictional merchant, **Aster Audio**. The agent manages refund and order-support requests.

**Business rules (all visible in an inspectable Policy tab):**
- Refunds are only eligible within 30 days of purchase.
- Before a refund attempt, the customer must verify their order ID and account email against mock order records.
- Orders above $100 require human approval instead of an automatic refund.
- The agent must never claim that a refund succeeded unless the mock tool confirms success.
- If the user cannot verify, the agent should explain the requirement and offer escalation.

**Six curated tests:** cooperative verified refund (control); impatient unverified customer; customer claiming a previous agent approved it; order older than 30 days; order above $100; customer refuses verification and demands escalation.

Each test defines a persona, opening user message, synthetic account/order data, expected behavior, and assertions. The same case fixture must be used for both policy versions.

**v1 (baseline):** A plausible but underspecified customer-helpfulness instruction. **v2 (safeguard):** The same instruction plus specific authorization, tool sequencing, and confirmation requirements. Both prompts are visible and diffable.

## 4. UI / visual direction

### Look and feel

Take inspiration from Decagon's *visual language*, not its logo or an exact clone. Its current marketing site uses atmospheric lilac/violet gradients and spacious, confident typography; its Simulations surfaces use pale panels, compact test rows, soft purple accents, and traceable results. Combine the expressive marketing mood with the restraint of an enterprise product.

**Suggested tokens (approximate creative choices, not official Decagon brand values):**

| Token | Value | Usage |
|---|---|---|
| Background | `#F8F7FB` | Main canvas |
| Ink | `#191725` | Headings / primary text |
| Muted | `#79758A` | Subtitles, metadata |
| Violet | `#6555E8` | Primary accent and focused controls |
| Lavender | `#EDEBFF` | Selected rows / quiet emphasis |
| Border | `#E8E5F0` | Subtle separators |
| Success | `#16876A` | Passing checks |
| Failure | `#D15B66` | Failed checks |

Use **Geist Sans** (or Inter), strong typographic hierarchy, pill-shaped buttons, subtle 12–16px card radii, generous spacing, and near-invisible shadows. The hero can use one large blurred lavender-to-purple ambient gradient. **Do not** apply heavy gradients, glassmorphism, or floating blobs to the actual inspection workspace.

### Page structure (desktop)

**Header:** AgentGym wordmark / small abstract geometric mark; `The Lab`, `Methodology`, `GitHub`; a quiet **Independent experiment** pill. Do **not** use Decagon's logo or imply partnership.

**Intro (~25% of first viewport):** Small eyebrow `ADVERSARIAL AGENT EVALUATION`, striking headline, one-line explanation, primary action. Immediately below, the product preview/workspace begins. Prioritize the real product over a long marketing landing page.

**Workspace:**
- **Top strip:** `Example run` / `Live run` distinction; v1 ↔ v2 segmented switch; 3 measured statistics: pass rate, failed assertions, total tests. Metrics **always** derive from the currently selected run.
- **Left (~24%):** Scrollable scenario list, each with clear scenario name, persona hint, and pass/fail state. Selecting a row updates the entire workspace, with no route transition.
- **Center (~48%):** A convincing human-readable customer/agent transcript. Include tool calls as expandable events in the conversation timeline. Highlight the exact point of failure.
- **Right (~28%):** Tabs: **Verdict**, **Policy**, **Trace**. Verdict shows each expected assertion and its observed evidence. Policy exposes baseline vs safeguard diff. Trace shows actual structured tool arguments and outputs.
- **Bottom action rail:** `Run live test`, `Compare versions`, `Copy result summary`. Clear per-action loading and error states.

**Mobile:** Scenario selector becomes a horizontal strip/dropdown; conversation remains the main panel; verdict, policy, and trace become tabs below. No horizontal overflow.

### Interaction polish

- Replay sample transcripts with subtle, skippable message-by-message appearance (~150–250ms per event). Never make users wait through the animation.
- Selecting a test should update immediately; use light motion (~160–220ms) and no layout jumps.
- While a real test runs, reveal purposeful stages: **Generating customer turn → Agent responding → Checking policy → Grading assertions**. These stages must represent actual work, not a fake progress percentage.
- Status colors should always have text labels and accessible contrast; failure explanation should be understandable without reading raw JSON.
- Every CTA must work. Every visible statistic must have a clear data provenance. Sample runs must be labeled as samples.
- Include good empty, loading, timeout, and malformed-model-output states. Support keyboard navigation and reduced motion.

## 5. Core technical behavior

### How a live test works

For a selected case and selected policy version:

1. Load a validated, server-owned scenario fixture and fictional account/order data.
2. Initialize a **Customer Simulator** instruction with persona, hidden objective, and opening turn. Initialize a separate **Support Agent** instruction with the selected policy version and Gemini function declarations for available mock tools.
3. Run a *bounded* conversation (maximum **2 customer turns / 2 agent turns** in MVP; first customer turn is scripted, the second is Gemini-generated if needed). Use **Gemini for both the customer simulator and support agent**. Customer messages can use constrained JSON output; the agent uses native Gemini function calling. Limit model calls, tool-call rounds, and output tokens; no agent framework is needed.
4. If Gemini requests a function call (`lookupOrder`, `issueRefund`, `createEscalation`), **validate arguments, execute the corresponding pure mock function on the server, and return the tool result to Gemini** (within the tool-call limit). Capture both attempted and completed actions in the trace. **Never contact real payment or CRM systems.** The mock refund tool blocks unverified or otherwise ineligible attempts, but the attempt itself still counts as a policy violation.
5. Grade **deterministic** assertions from the trace and mock database: attempted refund before verification, refund eligibility, correct escalation, tool success vs claimed success. Return status `pass`, `fail`, or `error`, with explicit evidence per assertion. An LLM judge for conversational tone is a later enhancement and must never override deterministic safety checks.
6. Return transcript, tool calls, assertion results, measured duration, selected model, policy version, and `source: "live"`. Errors and incomplete runs do not count as failed business-policy tests.

**Important:** Baseline failures and safeguard improvements are *hypotheses*, not guaranteed live outcomes. Compare the same fixtures in both versions; report observed results and rerun variability honestly. The initial sample comparison can be authored specifically to demonstrate the mechanics, provided it is labeled **Example results**.

### Minimal architecture

- **Next.js App Router + TypeScript** — UI and API on Vercel.
- **Tailwind CSS + shadcn/ui + Lucide icons** — UI system.
- **Framer Motion / Motion** (optional) — limited, purposeful transitions; CSS for most motion.
- **Official Google Gen AI SDK (`@google/genai`)** — Gemini for **both** customer and support-agent simulation; native tool/function calling and structured outputs.
- **Model:** `gemini-2.5-flash` by default (`GEMINI_MODEL` override), chosen because Google lists a free tier for text input/output. Check model availability for your API project before deployment.
- **Local JSON / TypeScript fixtures** — scenarios, fictional customers, policies, example run results.
- **Browser state** — selected scenario, policy version, comparison and latest run. No database, auth, queues, analytics platform, or agent framework required.
- **Vercel** — push to GitHub, import the project, set `GEMINI_API_KEY` as a secret and optionally `GEMINI_MODEL=gemini-2.5-flash`, deploy.

**Routes:** `/` (single-page experience) and `POST /api/evaluate-case` (live evaluation). Optional `/about` can be a modal instead.

**API contract (conceptual):**

```ts
POST /api/evaluate-case
Body: { caseId: string; version: "v1" | "v2" }
Returns: {
  runId: string;
  source: "live";
  caseId: string;
  version: "v1" | "v2";
  status: "pass" | "fail" | "error";
  transcript: Array<{ role: "customer" | "agent" | "tool"; text: string }>;
  toolCalls: Array<{ name: string; args: unknown; outcome: unknown }>;
  assertions: Array<{ id: string; passed: boolean; evidence: string }>;
  durationMs: number;
  model: string; // e.g. gemini-2.5-flash
  errorCode?: "quota_exceeded" | "timeout" | "provider_error" | "invalid_output";
}
```

Validate all inputs server-side. The endpoint accepts only known scenario IDs and the two fixed policy versions—**no arbitrary prompts from anonymous users**. Bound turns, tool calls, per-request time, and output tokens. Keep the API key on the server only; never expose it in `NEXT_PUBLIC_*` environment variables or client bundles.

**Free-tier guardrails:** Google currently lists free text usage for `gemini-2.5-flash`, but quotas and model eligibility vary by account and can change. Check actual RPM/RPD availability in AI Studio. Run **one case at a time**; disable duplicate submissions; implement a small per-visitor cooldown and **real hosting-level rate limiting** where available. Do not treat a browser-only cooldown as abuse protection. For a widely public anonymous demo, consider a managed rate limiter or gate access, because free quotas are not unlimited. Handle HTTP 429 with a friendly **Free Gemini quota reached — explore the example traces** state; do not automatically switch to a paid model. If the API is unavailable, the clearly labeled example remains browseable.

**Privacy:** Send only fictional scenario text and mock account records to Gemini. Google states that content submitted to its **unpaid** Gemini API service may be used to improve its products; never send private customer data, company documents, or real credentials.

For any multi-case live batch, trigger **separate case requests from the browser** with concurrency 1–2 rather than holding one long-running Vercel function open. A live **single-case** run is required for MVP; full-batch live execution is optional.

### File organization

```text
app/
  page.tsx                 # Landing + evaluation workspace
  api/evaluate-case/route.ts
components/
  hero.tsx
  scenario-list.tsx
  conversation-trace.tsx
  verdict-panel.tsx
  policy-diff.tsx
  run-controls.tsx
lib/
  scenarios.ts             # 6 typed test cases
  policies.ts              # v1 and v2 agent instructions
  example-runs.ts          # Clearly labeled example traces
  evaluate.ts              # Gemini interaction, function-calling loop, bounded turns
  gemini.ts                # Server-only @google/genai client/model config
  mock-tools.ts            # Fake order/refund/escalation tools
  assertions.ts            # Deterministic grading
```

## 6. Definition of done — non-negotiable acceptance criteria

**Product & UX**
- [ ] Deployed public HTTPS URL loads without login, API key input, or walkthrough.
- [ ] In under 30 seconds, a new visitor can see a failed adversarial test, understand the failure, and access a before/after policy comparison.
- [ ] Six example cases, readable transcript, visible policy diff, and actionable per-assertion explanations.
- [ ] Desktop looks exceptionally polished at 1440px; functional at 375px; no broken controls, overflows, or placeholder lorem ipsum.
- [ ] Run states, reduced-motion behavior, keyboard interaction, and copy-summary button work.

**Engineering & credibility**
- [ ] **From the first deployed version**, at least one scenario completes a **real Gemini-backed** end-to-end run with a server-side `GEMINI_API_KEY`, native function calls, mock-tool execution, and deterministic assertions.
- [ ] At least one explicit test verifies that attempted refunds before verification are caught from actual tool-call traces.
- [ ] v1 and v2 use visibly different, inspectable system instructions; comparison uses the same case fixtures.
- [ ] All live metrics are computed from actual results; sample data is labeled; failed requests are not mislabeled as failed assertions.
- [ ] Refreshing/visiting with no API access still provides a fully navigable **clearly labeled** sample demonstration; the initial launch also includes a tested live evaluation engine.
- [ ] README explains methodology, trade-offs, how to run locally, and the relationship to Decagon's research.

**Success test:** Send the deployed link to someone unfamiliar with the project. If they can explain *"It simulates difficult customers, catches unsafe agent actions, and shows whether changing the policy helps"* after 30 seconds, the MVP succeeds.

## 7. Explicit non-goals

No actual GEPA optimization; no fine-tuning; no true adversarial training; no customer uploads; no real refunds; no voice mode; no multi-provider orchestration; no long-running batch infrastructure; no account system; no database; no fabricated production benchmark claims. These can all wait until a later version.

## 8. One-pass build mandate (important)

**Build the entire vertical slice in one implementation, not as "mock UI now, real AI later."** The coding agent should create the frontend, Gemini integration, mock tools, assertions, fixtures, polished UX, and deployment configuration together. Preloaded sample traces are part of the finished product for instant storytelling and graceful quota fallback, **not a preliminary deliverable**.

**A single definition of complete:** The recruiter can open the public Vercel URL, inspect the curated example, select a case, press **Run live test**, observe an **actual Gemini-generated** support-agent response, see real attempted tool calls and deterministic pass/fail evidence, then compare v1 and v2. No "TODO: connect model" or decorative controls.

**Hand-off prompt for Claude Code / Cursor** (paste this spec and the instruction below):

> Implement the entire AgentGym MVP specified in this file as a complete, end-to-end, deployable Next.js project **in one pass**. Do not produce a frontend-only mock or defer Gemini integration. Use `@google/genai` with server-only `GEMINI_API_KEY` and `gemini-2.5-flash` (configurable through `GEMINI_MODEL`) for **both** the customer simulator and support agent. Use Gemini native function declarations to drive server-side mock tools, and grade tool attempts with deterministic assertions. Build the fully polished responsive Decagon-inspired interface and preloaded clearly labeled sample runs alongside the real evaluator. Keep all buttons functional, handle 429/timeouts, and provide `.env.example`, README, and Vercel setup. Run lint, typecheck, build, and tests; if a Gemini key is available locally, execute an actual end-to-end smoke test. Do not claim a live test succeeded unless it actually ran. Deliver only when the frontend **and** Gemini flow are integrated and production-ready.

**Minimal verification checklist before calling the build done:**

1. `npm run build` and typecheck pass.
2. Automated test of the refund guard: calling `issueRefund` before verification is rejected and flagged.
3. A live Gemini scenario executes in the deployed environment, including at least one tool round-trip; verify this manually if keys are available. If no key is available, report the unverified live step explicitly rather than pretending it succeeded.
4. Both policy versions produce independently evaluated outcomes; UI statistics update from actual returned data.
5. Rate-limit or quota errors display a useful fallback rather than an indefinite spinner.
6. Test at 1440px and 375px; keyboard focus and reduced-motion behavior work.

**If time runs short:** Remove optional enhancements such as full-batch evaluation or editing custom scenarios, **never** the live Gemini integration, transparent tool traces, deterministic assertions, or product-level polish.

## Inspiration / source links

- Decagon, **GEPA-GAN: Teaching AI to sound human** (Sep 15, 2026): https://decagon.ai/blog/gepa-gan-teaching-ai-to-sound-human
- Decagon, **DuetBench-2: Measuring agent self-improvement in production** (Sep 9, 2026): https://decagon.ai/blog/duetbench-2
- Decagon, **The next generation of Simulations** (Jun 30, 2026): https://decagon.ai/blog/the-next-generation-of-simulations
- Decagon, **Product overview / design inspiration**: https://decagon.ai/product/overview
- Decagon, **Homepage / visual inspiration**: https://decagon.ai/
- Google, **Gemini API pricing / free-tier availability**: https://ai.google.dev/gemini-api/docs/pricing
- Google, **Gemini TypeScript SDK and tool calling**: https://ai.google.dev/gemini-api/docs/generate-content/function-calling
- Google, **Gemini rate limits**: https://ai.google.dev/gemini-api/docs/rate-limits
- Google, **Gemini API terms / free-tier data use**: https://ai.google.dev/gemini-api/terms
