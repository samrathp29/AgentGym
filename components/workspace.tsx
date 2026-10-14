"use client";

import { useMemo, useState } from "react";
import { ConversationTrace } from "@/components/conversation-trace";
import { PolicyDiff } from "@/components/policy-diff";
import { RunControls } from "@/components/run-controls";
import { ScenarioList } from "@/components/scenario-list";
import { VerdictPanel } from "@/components/verdict-panel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { getExampleRun, listExampleRuns } from "@/lib/example-runs";
import { isCaseId, listScenarios } from "@/lib/scenarios";
import { copySummary, computeStats, formatPassRate } from "@/lib/stats";
import type {
  CaseId,
  ErrorCode,
  EvalRun,
  LiveStage,
  PolicyVersion,
} from "@/lib/types";

type RunMode = "example" | "live";
type InspectorTab = "verdict" | "policy" | "trace";

const STAGES: LiveStage[] = [
  "Generating customer turn",
  "Agent responding",
  "Checking policy",
  "Grading assertions",
];

function liveKey(version: PolicyVersion, caseId: CaseId) {
  return `${version}:${caseId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEvalRun(value: unknown): value is EvalRun {
  if (!isRecord(value)) return false;
  return (
    typeof value.runId === "string" &&
    (value.source === "live" || value.source === "example") &&
    isCaseId(value.caseId) &&
    (value.version === "v1" || value.version === "v2") &&
    (value.status === "pass" || value.status === "fail" || value.status === "error") &&
    Array.isArray(value.transcript) &&
    Array.isArray(value.toolCalls) &&
    Array.isArray(value.assertions)
  );
}

function errorCopy(code: ErrorCode | undefined): string {
  if (code === "quota_exceeded") {
    return "Free Gemini quota reached — explore the example traces.";
  }
  if (code === "timeout") {
    return "The live test timed out. The example trace is still available.";
  }
  if (code === "invalid_output") {
    return "The model returned output we could not parse. Try once more, or stay on the example.";
  }
  return "The live test could not reach Gemini. The labeled example remains browseable.";
}

export function Workspace() {
  const scenarios = listScenarios();
  const [version, setVersion] = useState<PolicyVersion>("v1");
  const [caseId, setCaseId] = useState<CaseId>("impatient-refund-request");
  const [mode, setMode] = useState<RunMode>("example");
  const [tab, setTab] = useState<InspectorTab>("verdict");
  const [live, setLive] = useState<Record<string, EvalRun>>({});
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<LiveStage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [compare, setCompare] = useState(false);
  const [skipMotion, setSkipMotion] = useState(false);

  const exampleRun = getExampleRun(caseId, version);
  const liveRun = live[liveKey(version, caseId)];
  const selectedRun = mode === "live" ? liveRun ?? null : exampleRun;

  const stats = useMemo(() => {
    if (mode === "example") return computeStats(listExampleRuns(version));
    const runs = Object.entries(live)
      .filter(([key]) => key.startsWith(`${version}:`))
      .map(([, run]) => run);
    return computeStats(runs);
  }, [mode, version, live]);

  async function runLive() {
    if (running) return;
    setRunning(true);
    setError(null);
    setMode("live");
    setStage("Generating customer turn");
    try {
      const response = await fetch("/api/evaluate-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, version }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("ndjson")) {
        const payload: unknown = await response.json();
        if (isEvalRun(payload)) {
          setLive((current) => ({ ...current, [liveKey(version, caseId)]: payload }));
          if (payload.status === "error") setError(errorCopy(payload.errorCode));
        } else {
          setError(errorCopy(response.status === 429 ? "quota_exceeded" : "provider_error"));
        }
        return;
      }
      if (!response.body) {
        throw new Error("empty");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let latest: EvalRun | null = null;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let payload: unknown;
          try {
            payload = JSON.parse(line);
          } catch {
            continue;
          }
          if (isRecord(payload) && payload.type === "stage") {
            const nextStage = STAGES.find((item) => item === payload.stage);
            if (nextStage) setStage(nextStage);
          }
          if (isRecord(payload) && payload.type === "result" && isEvalRun(payload.run)) {
            latest = payload.run;
          }
        }
      }
      if (!latest) {
        setError("The live test did not return a result.");
        return;
      }
      setLive((current) => ({ ...current, [liveKey(version, caseId)]: latest }));
      if (latest.status === "error") {
        setError(errorCopy(latest.errorCode));
      }
    } catch {
      setError(errorCopy("provider_error"));
    } finally {
      setRunning(false);
      setStage(null);
    }
  }

  async function copy() {
    if (!selectedRun) return;
    try {
      await navigator.clipboard.writeText(copySummary(selectedRun));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("Could not copy the summary.");
    }
  }

  const v1 = mode === "live" ? live[liveKey("v1", caseId)] ?? getExampleRun(caseId, "v1") : getExampleRun(caseId, "v1");
  const v2 = mode === "live" ? live[liveKey("v2", caseId)] ?? getExampleRun(caseId, "v2") : getExampleRun(caseId, "v2");

  return (
    <section id="lab" className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--background)]">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-[var(--background)] p-1">
              {(["example", "live"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setMode(item)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium",
                    mode === item ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]",
                  )}
                >
                  {item === "example" ? "Example run" : "Live run"}
                </button>
              ))}
            </div>
            <div className="flex rounded-full bg-[var(--background)] p-1">
              {(["v1", "v2"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setVersion(item)}
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px] font-medium",
                    version === item ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]",
                  )}
                >
                  {item === "v1" ? "v1 baseline" : "v2 safeguard"}
                </button>
              ))}
            </div>
            {mode === "example" ? (
              <span className="rounded-full bg-[var(--lavender)] px-2.5 py-1 text-[11px] font-medium text-[var(--violet)]">
                Sample data
              </span>
            ) : (
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] ring-1 ring-[var(--border)]">
                Gemini live
              </span>
            )}
          </div>
          <dl className="flex gap-5 text-[12px]">
            <div>
              <dt className="text-[var(--muted)]">Pass rate</dt>
              <dd className="font-semibold text-[var(--ink)]">{formatPassRate(stats.passRate)}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Failed assertions</dt>
              <dd className="font-semibold text-[var(--ink)]">{stats.failedAssertions}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Total tests</dt>
              <dd className="font-semibold text-[var(--ink)]">{stats.totalTests}</dd>
            </div>
          </dl>
        </div>

        {error ? (
          <div className="border-b border-[#ecdcc8] bg-[#fbf6ef] px-4 py-2 text-sm text-[#7a5428] sm:px-5">
            {error}
          </div>
        ) : null}

        <div className="grid gap-0 lg:grid-cols-[24%_48%_28%]">
          <aside className="border-b border-[var(--border)] p-3 lg:border-r lg:border-b-0">
            <p className="mb-2 hidden px-1 text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase md:block">
              Scenarios
            </p>
            <ScenarioList
              scenarios={scenarios}
              selectedId={caseId}
              onSelect={(id) => {
                setCaseId(id);
                setError(null);
              }}
              runFor={(id) =>
                mode === "live" ? live[liveKey(version, id)] : getExampleRun(id, version)
              }
            />
          </aside>

          <div className="min-w-0 border-b border-[var(--border)] p-4 lg:border-r lg:border-b-0">
            <ConversationTrace
              run={selectedRun}
              emptyLabel="No live result yet for this case. Run a live test, or switch back to the labeled example."
              skipMotion={skipMotion}
              onSkipMotion={() => setSkipMotion(true)}
            />
          </div>

          <aside className="p-4">
            <div className="mb-3 flex rounded-full bg-[var(--background)] p-1">
              {(["verdict", "policy", "trace"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  className={cn(
                    "flex-1 rounded-full px-2 py-1 text-[12px] font-medium capitalize",
                    tab === item ? "bg-white text-[var(--ink)] shadow-sm" : "text-[var(--muted)]",
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
            {tab === "verdict" ? <VerdictPanel run={selectedRun} /> : null}
            {tab === "policy" ? <PolicyDiff /> : null}
            {tab === "trace" ? (
              selectedRun ? (
                <pre className="max-h-[28rem] overflow-auto rounded-[14px] bg-white p-3 font-mono text-[11px] leading-4 text-[var(--ink)] ring-1 ring-[var(--border)]">
                  {JSON.stringify(selectedRun.toolCalls, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-[var(--muted)]">No tool trace yet.</p>
              )
            ) : null}
          </aside>
        </div>

        <RunControls
          running={running}
          stage={stage}
          canRun={!running}
          onRun={runLive}
          onCompare={() => setCompare(true)}
          onCopy={copy}
          copied={copied}
        />
      </div>

      {compare ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-[var(--ink)]/35 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-title"
          onClick={() => setCompare(false)}
        >
          <div
            className="max-h-[86vh] w-full max-w-4xl overflow-y-auto rounded-[20px] bg-white p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="compare-title" className="text-lg font-semibold text-[var(--ink)]">
              Compare versions · {scenarios.find((item) => item.id === caseId)?.name}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Same fixtures. {mode === "example" ? "Example results." : "Live results where available, example otherwise."}
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {[v1, v2].map((run) => (
                <section key={run.runId} className="rounded-[16px] border border-[var(--border)] p-3">
                  <p className="text-[12px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                    {run.version} · {run.status}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[13px]">
                    {run.assertions.map((assertion) => (
                      <li key={assertion.id} className="flex justify-between gap-2">
                        <span>{assertion.label}</span>
                        <span className={assertion.passed ? "text-[var(--success)]" : "text-[var(--failure)]"}>
                          {assertion.passed ? "Pass" : "Fail"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" onClick={() => setCompare(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
