"use client";

import { cn } from "@/lib/cn";
import { isCaseId } from "@/lib/scenarios";
import type { CaseId, EvalRun, Scenario } from "@/lib/types";

type ScenarioListProps = {
  scenarios: Scenario[];
  selectedId: CaseId;
  onSelect: (id: CaseId) => void;
  runFor: (id: CaseId) => EvalRun | undefined;
};

function StatusDot({ run }: { run: EvalRun | undefined }) {
  if (!run) {
    return (
      <span className="rounded-full bg-[var(--lavender)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
        Not run
      </span>
    );
  }
  if (run.status === "error") {
    return (
      <span className="rounded-full bg-[#f4ece4] px-2 py-0.5 text-[10px] font-medium text-[#8a5a32]">
        Error
      </span>
    );
  }
  if (run.status === "pass") {
    return (
      <span className="rounded-full bg-[#e5f4ee] px-2 py-0.5 text-[10px] font-medium text-[var(--success)]">
        Pass
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#f8e8ea] px-2 py-0.5 text-[10px] font-medium text-[var(--failure)]">
      Fail
    </span>
  );
}

export function ScenarioList({ scenarios, selectedId, onSelect, runFor }: ScenarioListProps) {
  return (
    <>
      <div className="mb-3 md:hidden">
        <label className="sr-only" htmlFor="scenario-select">
          Scenario
        </label>
        <select
          id="scenario-select"
          className="h-10 w-full rounded-full border border-[var(--border)] bg-white px-4 text-sm text-[var(--ink)]"
          value={selectedId}
          onChange={(event) => {
            if (isCaseId(event.target.value)) onSelect(event.target.value);
          }}
        >
          {scenarios.map((scenario) => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
      </div>
      <ul
        className="hidden max-h-[34rem] space-y-1 overflow-y-auto pr-1 md:block"
        role="listbox"
        aria-label="Test scenarios"
      >
        {scenarios.map((scenario) => {
          const selected = scenario.id === selectedId;
          const run = runFor(scenario.id);
          return (
            <li key={scenario.id}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => onSelect(scenario.id)}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-[14px] border px-3 py-2.5 text-left transition-colors duration-200",
                  selected
                    ? "border-transparent bg-[var(--lavender)]"
                    : "border-transparent hover:bg-white",
                )}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[13px] leading-5 font-medium text-[var(--ink)]">
                    {scenario.name}
                  </span>
                  <StatusDot run={run} />
                </span>
                <span className="text-[12px] text-[var(--muted)]">{scenario.personaHint}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
