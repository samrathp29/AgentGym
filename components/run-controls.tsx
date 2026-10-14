"use client";

import { Button } from "@/components/ui/button";
import type { LiveStage } from "@/lib/types";

type RunControlsProps = {
  running: boolean;
  stage: LiveStage | null;
  canRun: boolean;
  onRun: () => void;
  onCompare: () => void;
  onCopy: () => void;
  copied: boolean;
};

const STAGES: LiveStage[] = [
  "Synthesizing adversarial customer",
  "Agent deliberating with tools",
  "Enforcing policy constraints",
  "Scoring deterministic assertions",
];

export function RunControls({
  running,
  stage,
  canRun,
  onRun,
  onCompare,
  onCopy,
  copied,
}: RunControlsProps) {
  return (
    <div className="border-t border-[var(--border)] bg-white/90 px-4 py-3 sm:px-5">
      {running ? (
        <ol className="mb-3 flex flex-wrap gap-2">
          {STAGES.map((item) => {
            const active = stage === item;
            const idx = STAGES.indexOf(item);
            const current = stage ? STAGES.indexOf(stage) : -1;
            const done = current > idx;
            return (
              <li
                key={item}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  active
                    ? "bg-[var(--lavender)] text-[var(--violet)]"
                    : done
                      ? "bg-[#e5f4ee] text-[var(--success)]"
                      : "bg-[var(--background)] text-[var(--muted)]"
                }`}
              >
                {item}
              </li>
            );
          })}
        </ol>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onRun} disabled={!canRun || running}>
          {running ? "Running evaluation…" : "Run evaluation"}
        </Button>
        <Button variant="secondary" onClick={onCompare}>
          Compare prompts
        </Button>
        <Button variant="ghost" onClick={onCopy}>
          {copied ? "Copied" : "Copy result summary"}
        </Button>
        <p className="w-full text-[12px] text-[var(--muted)] sm:ml-auto sm:w-auto">
          Same fixtures under both prompts. Compare to see the delta.
        </p>
      </div>
    </div>
  );
}
