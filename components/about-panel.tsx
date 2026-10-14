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
          Closed-loop adversarial evaluation
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
          <p>
            AgentGym runs a dual-agent simulation over six Aster Audio refund scenarios. An
            adversarial customer model pressure-tests a policy-bound support agent while both
            agents share a live tool runtime against the Aster Audio order catalog, refund
            ledger, and escalation queue.
          </p>
          <p>
            Every live episode clones an isolated ledger so evaluation runs stay hermetic. The
            ops plane still enforces verification, the 30-day eligibility window, the $100
            auto-refund ceiling, and idempotent refund state. A blocked tool call is retained as
            a first-class behavioral signal for the grader.
          </p>
          <p>
            Scoring is fully deterministic over the structured tool trace. No LLM-as-judge. The
            lab A/B tests two instruction regimes on identical fixtures: Helpful only, and Verify
            first. Live outcomes are measured under the current reasoning runtime. Curated
            example traces keep the product story inspectable when capacity is constrained.
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
