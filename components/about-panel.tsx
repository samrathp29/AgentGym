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
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--violet)] uppercase">
          About this experiment
        </p>
        <h2 id="about-title" className="mt-2 text-xl font-semibold tracking-tight text-[var(--ink)]">
          A miniature adversarial lab, not a benchmark
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--muted)]">
          <p>
            AgentGym runs six Aster Audio refund cases against a support agent. The customer
            simulator and the agent both use Gemini. Tools are mock functions on the server.
            Assertions are deterministic reads of those tool traces, not an LLM judge.
          </p>
          <p>
            Baseline (v1) vs safeguard (v2) is a hypothesis. Live reruns can vary. Example runs are
            authored sample data so the story is visible even when the Gemini quota is exhausted.
          </p>
          <p>
            Independent prototype. Not a Decagon product, not a reproduction of GEPA-GAN or
            DuetBench-2. Visual language is inspired by Decagon&apos;s public site, not copied from
            it.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <a className="text-[var(--violet)] hover:underline" href="https://decagon.ai/blog/gepa-gan-teaching-ai-to-sound-human">
                GEPA-GAN
              </a>
            </li>
            <li>
              <a className="text-[var(--violet)] hover:underline" href="https://decagon.ai/blog/duetbench-2">
                DuetBench-2
              </a>
            </li>
            <li>
              <a className="text-[var(--violet)] hover:underline" href="https://decagon.ai/blog/the-next-generation-of-simulations">
                Simulations
              </a>
            </li>
          </ul>
          <p>
            Live calls send only fictional scenario text to Google&apos;s Gemini API. Google may use
            unpaid API content to improve its products. No real customer data is involved.
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
