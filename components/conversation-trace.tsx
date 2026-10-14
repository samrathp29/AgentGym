"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { EvalRun, TranscriptEvent } from "@/lib/types";

type ConversationTraceProps = {
  run: EvalRun | null;
  emptyLabel: string;
  skipMotion: boolean;
  onSkipMotion: () => void;
};

function speaker(role: TranscriptEvent["role"]): string {
  if (role === "customer") return "Customer";
  if (role === "agent") return "Agent";
  return "Tool";
}

export function ConversationTrace({
  run,
  emptyLabel,
  skipMotion,
  onSkipMotion,
}: ConversationTraceProps) {
  const events = run?.transcript ?? [];
  const [skippedId, setSkippedId] = useState<string | null>(null);
  const skip = skipMotion || (run !== null && skippedId === run.runId);
  const firstFailure = events.findIndex((event) => event.failed);
  const failedAssertion = run?.assertions.find((assertion) => !assertion.passed);

  if (!run) {
    return (
      <div className="flex min-h-[22rem] items-center justify-center rounded-[16px] border border-dashed border-[var(--border)] bg-white px-6 text-center text-sm text-[var(--muted)]">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="flex min-h-[22rem] flex-col">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium tracking-wide text-[var(--muted)] uppercase">
          Transcript
        </p>
        {!skip ? (
          <button
            type="button"
            className="text-[12px] font-medium text-[var(--violet)] hover:underline"
            onClick={() => {
              setSkippedId(run.runId);
              onSkipMotion();
            }}
          >
            Skip animation
          </button>
        ) : null}
      </div>
      <ol className="space-y-2.5">
        {events.map((event, index) => {
          const failed = event.failed || index === firstFailure;
          const delay = skip ? "0ms" : `${index * 180}ms`;
          const motionClass = skip ? "opacity-100" : "trace-event";

          if (event.role === "tool") {
            return (
              <li
                key={`${run.runId}-${event.role}-${index}`}
                className={cn(
                  "rounded-[14px] border bg-white px-3 py-2 text-[13px]",
                  motionClass,
                  failed
                    ? "border-[var(--failure)]/40 ring-1 ring-[var(--failure)]/20"
                    : "border-[var(--border)]",
                )}
                style={{ animationDelay: delay }}
              >
                <details>
                  <summary className="cursor-pointer font-medium text-[var(--ink)]">
                    <span className="mr-2 text-[11px] tracking-wide text-[var(--muted)] uppercase">
                      Tool
                    </span>
                    {event.toolName ?? "call"}
                    {failed ? (
                      <span className="ml-2 text-[11px] font-medium text-[var(--failure)]">
                        Failed
                      </span>
                    ) : null}
                  </summary>
                  <pre className="mt-2 overflow-x-auto font-mono text-[12px] leading-5 text-[var(--muted)] whitespace-pre-wrap">
                    {event.text}
                  </pre>
                </details>
                {failed && failedAssertion ? (
                  <p className="mt-2 text-[12px] font-medium text-[var(--failure)]">
                    Failed: {failedAssertion.label.toLowerCase()}
                  </p>
                ) : null}
              </li>
            );
          }

          const customer = event.role === "customer";
          return (
            <li
              key={`${run.runId}-${event.role}-${index}`}
              className={cn(
                "max-w-[92%] rounded-[16px] px-3.5 py-2.5 text-[14px] leading-5",
                motionClass,
                customer
                  ? "ml-auto bg-[var(--ink)] text-white"
                  : "bg-white text-[var(--ink)] ring-1 ring-[var(--border)]",
              )}
              style={{ animationDelay: delay }}
            >
              <p
                className={cn(
                  "mb-1 text-[10px] font-medium tracking-wide uppercase",
                  customer ? "text-white/60" : "text-[var(--muted)]",
                )}
              >
                {speaker(event.role)}
              </p>
              {event.text}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
