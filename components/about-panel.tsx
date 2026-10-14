"use client";

import { Button } from "@/components/ui/button";

type AboutPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function AboutPanel({ open, onClose }: AboutPanelProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[var(--ink)]/35 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-title"
      onClick={onClose}
    >
      <div
        className="max-h-[86vh] w-full max-w-xl overflow-y-auto rounded-[20px] bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[13px] font-medium text-[var(--violet)]">
          Methodology
        </p>
        <h2 id="about-title" className="mt-2 text-xl font-semibold tracking-tight text-[var(--ink)]">
          How AgentGym grades a support agent
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
          <p>
            Six Aster Audio refund cases hit a support agent. Gemini plays both the customer and
            the agent. The agent calls the same three ops tools a desk would use: lookupOrder,
            issueRefund, and createEscalation.
          </p>
          <p>
            Those tools write to a real order catalog, refund ledger, and ticket queue for the
            Aster Audio tenant. Each live run clones a fresh ledger so one test cannot contaminate
            the next. The API still enforces verification, the 30-day window, the $100 cap, and
            no double refunds. A blocked call is still an attempt, and that is what the grader
            reads.
          </p>
          <p>
            Assertions are deterministic over the tool trace. There is no LLM judge. Baseline (v1)
            vs safeguard (v2) is a hypothesis. Live reruns can vary. Example runs are authored
            sample data so the story stays visible if the live path is down.
          </p>
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
