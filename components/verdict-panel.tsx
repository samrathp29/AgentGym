"use client";

import { cn } from "@/lib/cn";
import { splitEvidence } from "@/lib/evidence";
import type { EvalRun } from "@/lib/types";

type VerdictPanelProps = {
  run: EvalRun | null;
};

export function VerdictPanel({ run }: VerdictPanelProps) {
  if (!run) {
    return <p className="text-sm text-[var(--muted)]">Select a scenario to inspect assertions.</p>;
  }
  if (run.status === "error") {
    return (
      <div className="rounded-[14px] border border-[#ecdcc8] bg-[#fbf6ef] px-3 py-3 text-sm text-[#7a5428]">
        This evaluation episode did not complete, so it is not counted as a policy failure.
        {run.errorCode === "quota_exceeded"
          ? " Inference capacity is saturated. Explore the sample suite."
          : run.errorCode === "timeout"
            ? " The episode exceeded its latency budget."
            : " The reasoning runtime returned an error."}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {run.assertions.map((assertion) => {
        const { summary, detail } = splitEvidence(assertion.evidence);
        return (
          <li
            key={assertion.id}
            className="rounded-[14px] border border-[var(--border)] bg-white px-3 py-2.5"
          >
            <p className="flex items-start justify-between gap-2 text-[13px] font-medium text-[var(--ink)]">
              {assertion.label}
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  assertion.passed
                    ? "bg-[#e5f4ee] text-[var(--success)]"
                    : "bg-[#f8e8ea] text-[var(--failure)]",
                )}
              >
                {assertion.passed ? "Pass" : "Fail"}
              </span>
            </p>
            <p className="mt-1.5 text-[12px] leading-5 text-[var(--muted)]">{summary}</p>
            {detail ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] font-medium text-[var(--violet)]">
                  Tool payload
                </summary>
                <pre className="mt-1.5 overflow-x-auto font-mono text-[11px] leading-4 text-[var(--muted)] whitespace-pre-wrap">
                  {detail}
                </pre>
              </details>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
