"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { POLICIES } from "@/lib/policies";
import type { EvalRun, TranscriptEvent } from "@/lib/types";

type CompareScrubberProps = {
  caseName: string;
  helpful: EvalRun;
  verifyFirst: EvalRun;
  modeNote: string;
  onClose: () => void;
};

function criticalEvents(run: EvalRun): TranscriptEvent[] {
  const tools = run.transcript.filter((event) => event.role === "tool");
  if (tools.length > 0) return tools.slice(0, 3);
  return run.transcript.slice(0, 3);
}

function RunPane({
  run,
  emphasis,
}: {
  run: EvalRun;
  emphasis: "fail" | "pass";
}) {
  const events = criticalEvents(run);
  return (
    <div className="flex h-full min-h-[20rem] flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-medium text-[var(--muted)]">{POLICIES[run.version].title}</p>
          <p className="mt-0.5 max-w-md text-[11px] leading-4 text-[var(--muted)]">
            {POLICIES[run.version].summary}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
            run.status === "pass"
              ? "bg-[#e5f4ee] text-[var(--success)]"
              : "bg-[#f8e8ea] text-[var(--failure)]",
          )}
        >
          {run.status}
        </span>
      </div>
      <ul className="space-y-2">
        {events.map((event, index) => {
          const failed = Boolean(event.failed);
          return (
            <li
              key={`${run.runId}-${index}`}
              className={cn(
                "rounded-[12px] px-3 py-2 text-[12px] leading-4",
                event.role === "tool"
                  ? failed
                    ? "border border-[var(--failure)]/35 bg-[#fdf6f7] font-mono text-[#8a3d46]"
                    : "border border-[var(--border)] bg-white font-mono text-[var(--ink)]"
                  : "bg-[var(--background)] text-[var(--ink)]",
                emphasis === "fail" && failed && "ring-1 ring-[var(--failure)]/30",
                emphasis === "pass" && event.role === "tool" && !failed && "ring-1 ring-[var(--success)]/25",
              )}
            >
              {event.role === "tool" ? (
                <>
                  <span className="font-medium">{event.toolName ?? "tool"}</span>
                  <span className="text-[var(--muted)]"> · </span>
                  <span>{failed ? "blocked" : "ok"}</span>
                </>
              ) : (
                event.text
              )}
            </li>
          );
        })}
      </ul>
      <ul className="mt-auto space-y-1.5 border-t border-[var(--border)] pt-3">
        {run.assertions.map((assertion) => (
          <li key={assertion.id} className="flex justify-between gap-2 text-[12px]">
            <span className="text-[var(--ink)]">{assertion.label}</span>
            <span className={assertion.passed ? "text-[var(--success)]" : "text-[var(--failure)]"}>
              {assertion.passed ? "Pass" : "Fail"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CompareScrubber({
  caseName,
  helpful,
  verifyFirst,
  modeNote,
  onClose,
}: CompareScrubberProps) {
  const [position, setPosition] = useState(48);
  const helpfulPass = useMemo(
    () => helpful.assertions.filter((a) => a.passed).length / Math.max(helpful.assertions.length, 1),
    [helpful],
  );
  const verifyPass = useMemo(
    () =>
      verifyFirst.assertions.filter((a) => a.passed).length /
      Math.max(verifyFirst.assertions.length, 1),
    [verifyFirst],
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[var(--ink)]/40 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(25,23,37,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-[var(--border)] px-5 py-4">
          <h2 id="compare-title" className="text-lg font-semibold text-[var(--ink)]">
            Before / after · {caseName}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Same customer, same order. Drag to reveal Verify first over Helpful only.
            {modeNote}
          </p>
        </header>

        <div className="relative min-h-[22rem] flex-1 overflow-hidden bg-[var(--background)]">
          <div className="absolute inset-0 p-4 sm:p-5">
            <RunPane run={verifyFirst} emphasis="pass" />
          </div>
          <div
            className="absolute inset-0 bg-white p-4 sm:p-5"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <RunPane run={helpful} emphasis="fail" />
          </div>
          <div
            className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-[var(--violet)]"
            style={{ left: `${position}%` }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--violet)] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white uppercase shadow-md"
            style={{ left: `${position}%` }}
          >
            Scrub
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--border)] px-5 py-4">
          <label className="block">
            <span className="sr-only">Compare scrub position</span>
            <input
              type="range"
              min={8}
              max={92}
              value={position}
              onChange={(event) => setPosition(Number(event.target.value))}
              className="compare-scrub w-full"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-[12px]">
              <span className="text-[var(--muted)]">Helpful only</span>
              <span className="font-semibold text-[var(--failure)]">
                {Math.round(helpfulPass * 100)}%
              </span>
              <span className="text-[var(--muted)]" aria-hidden>
                →
              </span>
              <span className="text-[var(--muted)]">Verify first</span>
              <span className="font-semibold text-[var(--success)]">
                {Math.round(verifyPass * 100)}%
              </span>
              <span className="text-[var(--muted)]">assertions passed on this case</span>
            </div>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
