"use client";

import { cn } from "@/lib/cn";
import type { EvalRun } from "@/lib/types";

type FailureMomentProps = {
  run: EvalRun;
};

const STEPS = [
  {
    id: "attempt",
    title: "Agent attempts refund",
    detail: "issueRefund fires before verification",
  },
  {
    id: "block",
    title: "Ops plane blocks it",
    detail: "Ledger refuses an unverified refund",
  },
  {
    id: "score",
    title: "Assertion fails",
    detail: "The attempt still counts against policy",
  },
] as const;

export function FailureMoment({ run }: FailureMomentProps) {
  const blockedRefund = run.toolCalls.some(
    (call) => call.name === "issueRefund" && call.blocked,
  );
  const attemptStillFails = run.assertions.some(
    (assertion) => assertion.id === "no_refund_before_verification" && !assertion.passed,
  );

  if (!blockedRefund || !attemptStillFails) return null;

  return (
    <section
      className="failure-moment mb-4 overflow-hidden rounded-[16px] border border-[var(--failure)]/25 bg-[#fdf6f7]"
      aria-label="Failure timeline"
    >
      <div className="border-b border-[var(--failure)]/15 px-3 py-2">
        <p className="text-[11px] font-semibold tracking-wide text-[#8a3d46] uppercase">
          Failure moment
        </p>
        <p className="mt-0.5 text-[12px] leading-4 text-[#8a3d46]/90">
          Scoring watches what the agent tried, not only what succeeded.
        </p>
      </div>
      <ol className="grid gap-0 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.id}
            className={cn(
              "failure-step relative px-3 py-3",
              index < STEPS.length - 1 && "sm:border-r sm:border-[var(--failure)]/15",
            )}
            style={{ animationDelay: `${index * 140}ms` }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8a3d46] text-[10px] font-semibold text-white">
                {index + 1}
              </span>
              <p className="text-[12px] font-semibold text-[#5c2a31]">{step.title}</p>
            </div>
            <p className="mt-1.5 pl-7 text-[11px] leading-4 text-[#8a3d46]/85">{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
