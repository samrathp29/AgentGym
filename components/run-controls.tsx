"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { EvalRun, LiveStage } from "@/lib/types";

type RunControlsProps = {
  running: boolean;
  stage: LiveStage | null;
  stageStartedAt: Partial<Record<LiveStage, number>>;
  now: number;
  canRun: boolean;
  selectedRun: EvalRun | null;
  episodeBanner: EvalRun | null;
  onRun: () => void;
  onCompare: () => void;
  onCopy: () => void;
  onShare: () => void;
  copied: boolean;
};

const STAGES: LiveStage[] = [
  "Synthesizing adversarial customer",
  "Agent deliberating with tools",
  "Enforcing policy constraints",
  "Scoring deterministic assertions",
];

const TOOL_CHIPS = ["lookupOrder", "issueRefund", "createEscalation"] as const;

function shortStage(stage: LiveStage): string {
  if (stage === "Synthesizing adversarial customer") return "Customer";
  if (stage === "Agent deliberating with tools") return "Agent + tools";
  if (stage === "Enforcing policy constraints") return "Policy";
  return "Assertions";
}

export function RunControls({
  running,
  stage,
  stageStartedAt,
  now,
  canRun,
  selectedRun,
  episodeBanner,
  onRun,
  onCompare,
  onCopy,
  onShare,
  copied,
}: RunControlsProps) {
  const currentIndex = stage ? STAGES.indexOf(stage) : -1;
  const toolsActive = stage === "Agent deliberating with tools";
  const usedTools = new Set(episodeBanner?.toolCalls.map((call) => call.name) ?? []);

  return (
    <div className="border-t border-[var(--border)] bg-white/90 px-4 py-3 sm:px-5">
      {running ? (
        <div className="mb-3 space-y-2">
          <ol className="grid gap-2 sm:grid-cols-4">
            {STAGES.map((item, idx) => {
              const active = stage === item;
              const done = currentIndex > idx;
              const started = stageStartedAt[item];
              const elapsed =
                started != null ? Math.max(0, Math.round((now - started) / 100) / 10) : null;
              return (
                <li
                  key={item}
                  className={cn(
                    "rounded-[14px] border px-3 py-2 transition-colors",
                    active
                      ? "stage-active border-[var(--violet)]/30 bg-[var(--lavender)]"
                      : done
                        ? "border-[var(--success)]/20 bg-[#e5f4ee]"
                        : "border-[var(--border)] bg-[var(--background)]",
                  )}
                >
                  <p
                    className={cn(
                      "text-[11px] font-semibold",
                      active
                        ? "text-[var(--violet)]"
                        : done
                          ? "text-[var(--success)]"
                          : "text-[var(--muted)]",
                    )}
                  >
                    {shortStage(item)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    {active && elapsed != null
                      ? `${elapsed.toFixed(1)}s`
                      : done
                        ? "done"
                        : "queued"}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap gap-1.5">
            {TOOL_CHIPS.map((chip) => (
              <span
                key={chip}
                className={cn(
                  "rounded-full px-2.5 py-1 font-mono text-[10px] transition-all",
                  toolsActive
                    ? "tool-chip-pulse bg-[var(--lavender)] text-[var(--violet)]"
                    : "bg-[var(--background)] text-[var(--muted)]",
                )}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {episodeBanner && !running ? (
        <div
          className={cn(
            "episode-complete mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[14px] px-3 py-2.5",
            episodeBanner.status === "pass"
              ? "bg-[#e5f4ee] text-[var(--success)]"
              : episodeBanner.status === "fail"
                ? "bg-[#f8e8ea] text-[var(--failure)]"
                : "bg-[#fbf6ef] text-[#7a5428]",
          )}
        >
          <p className="text-[12px] font-semibold">
            Episode complete · {episodeBanner.status.toUpperCase()} · {episodeBanner.durationMs}ms
          </p>
          <div className="flex flex-wrap gap-1.5">
            {TOOL_CHIPS.map((chip) => (
              <span
                key={chip}
                className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px]",
                  usedTools.has(chip)
                    ? "bg-white/80 text-[var(--ink)]"
                    : "bg-black/5 text-[var(--muted)]",
                )}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRun} disabled={!canRun || running}>
          {running ? "Running evaluation…" : "Run evaluation"}
        </Button>
        <Button variant="secondary" onClick={onCompare}>
          Compare prompts
        </Button>
        <Button variant="secondary" onClick={onShare} disabled={!selectedRun}>
          Share result
        </Button>
        <Button variant="ghost" onClick={onCopy} disabled={!selectedRun}>
          {copied ? "Copied" : "Copy summary"}
        </Button>
        <p className="w-full text-[12px] text-[var(--muted)] sm:ml-auto sm:w-auto">
          Same fixtures under both prompts. Compare to see the delta.
        </p>
      </div>
    </div>
  );
}
