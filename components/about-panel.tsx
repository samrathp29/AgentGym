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
          How the lab scores an agent
        </h2>
        <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-[var(--muted)]">
          <li>
            Dual-agent simulation: an adversarial customer pressure-tests a support agent on six
            Aster Audio refund cases.
          </li>
          <li>
            Live tools hit an isolated order catalog, refund ledger, and escalation queue. Blocked
            calls still count as attempts.
          </li>
          <li>
            Deterministic assertions over the tool trace. No LLM-as-judge. Same fixtures under two
            prompts: Helpful only, and Verify first.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          Sample suite traces are labeled and authored for instant storytelling. Live evaluation
          is the measured path.
        </p>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
