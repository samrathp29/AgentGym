"use client";

import { useEffect, useMemo, useState } from "react";
import { CompareScrubber } from "@/components/compare-scrubber";
import { ConversationTrace } from "@/components/conversation-trace";
import { PolicyDiff } from "@/components/policy-diff";
import { RunControls } from "@/components/run-controls";
import { ScenarioList } from "@/components/scenario-list";
import { ShareResult } from "@/components/share-result";
import { VerdictPanel } from "@/components/verdict-panel";
import { cn } from "@/lib/cn";
import { getExampleRun, listExampleRuns } from "@/lib/example-runs";
import { POLICIES } from "@/lib/policies";
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
  "Synthesizing adversarial customer",
  "Agent deliberating with tools",
  "Enforcing policy constraints",
  "Scoring deterministic assertions",
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
    return "Inference capacity is saturated. Explore the sample suite.";
  }
  if (code === "timeout") {
    return "The evaluation episode exceeded its latency budget. The sample suite is still available.";
  }
  if (code === "invalid_output") {
    return "The reasoning runtime returned an unparseable payload. Retry once, or stay on the sample suite.";
  }
  return "The evaluation runtime is temporarily unreachable. The sample suite remains fully browseable.";
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
  const [stageStartedAt, setStageStartedAt] = useState<Partial<Record<LiveStage, number>>>({});
  const [now, setNow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [compare, setCompare] = useState(false);
  const [share, setShare] = useState(false);
  const [skipMotion, setSkipMotion] = useState(false);
  const [episodeBanner, setEpisodeBanner] = useState<EvalRun | null>(null);

  function enterStage(next: LiveStage) {
    setStage(next);
    setStageStartedAt((current) =>
      current[next] != null ? current : { ...current, [next]: Date.now() },
    );
  }

  const exampleRun = getExampleRun(caseId, version);
  const liveRun = live[liveKey(version, caseId)];
  const selectedRun = mode === "live" ? liveRun ?? null : exampleRun;

  useEffect(() => {
    if (!compare && !share) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCompare(false);
        setShare(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [compare, share]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [running]);

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
    setEpisodeBanner(null);
    setStageStartedAt({});
    setNow(Date.now());
    enterStage("Synthesizing adversarial customer");
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
          setEpisodeBanner(payload);
          window.setTimeout(() => setEpisodeBanner(null), 4200);
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
            if (nextStage) enterStage(nextStage);
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
      setEpisodeBanner(latest);
      window.setTimeout(() => setEpisodeBanner(null), 4200);
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

  const v1 =
    mode === "live" ? live[liveKey("v1", caseId)] ?? getExampleRun(caseId, "v1") : getExampleRun(caseId, "v1");
  const v2 =
    mode === "live" ? live[liveKey("v2", caseId)] ?? getExampleRun(caseId, "v2") : getExampleRun(caseId, "v2");

  return (
    <section id="lab" className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--background)]">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-col gap-1.5">
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
                      {item === "example" ? "Sample suite" : "Live episode"}
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
                      {POLICIES[item].title}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[12px] leading-4 text-[var(--muted)]">
                {mode === "example"
                  ? "Labeled sample data for instant storytelling."
                  : "Measured dual-agent run against the live tool runtime."}{" "}
                {POLICIES[version].summary}
              </p>
            </div>
          </div>
          <div className="sm:text-right">
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
            <p className="mt-1 text-[11px] text-[var(--muted)]">
              {POLICIES[version].title} · {mode === "example" ? "sample suite" : "live episodes"}
            </p>
          </div>
        </div>

        {error ? (
          <div className="border-b border-[#ecdcc8] bg-[#fbf6ef] px-4 py-2 text-sm text-[#7a5428] sm:px-5">
            {error}
          </div>
        ) : null}

        <div className="grid gap-0 lg:grid-cols-[24%_48%_28%]">
          <aside className="border-b border-[var(--border)] p-3 lg:border-r lg:border-b-0">
            <p className="mb-2 hidden px-1 text-[12px] font-medium text-[var(--muted)] md:block">
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
              emptyLabel="No live episode yet for this case. Run an evaluation, or switch back to the sample suite."
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
          stageStartedAt={stageStartedAt}
          now={now}
          canRun={!running}
          selectedRun={selectedRun}
          episodeBanner={episodeBanner}
          onRun={() => {
            void runLive();
          }}
          onCompare={() => setCompare(true)}
          onShare={() => setShare(true)}
          onCopy={copy}
          copied={copied}
        />
      </div>

      {compare ? (
        <CompareScrubber
          caseName={scenarios.find((item) => item.id === caseId)?.name ?? caseId}
          helpful={v1}
          verifyFirst={v2}
          modeNote={
            mode === "example"
              ? " Sample suite results."
              : " Live results where available, sample suite otherwise."
          }
          onClose={() => setCompare(false)}
        />
      ) : null}

      {share && selectedRun ? (
        <ShareResult run={selectedRun} onClose={() => setShare(false)} />
      ) : null}
    </section>
  );
}
