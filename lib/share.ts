import { getExampleRun } from "@/lib/example-runs";
import { POLICIES } from "@/lib/policies";
import { getScenario, isCaseId } from "@/lib/scenarios";
import {
  CASE_IDS,
  type CaseId,
  type EvalRun,
  type PolicyVersion,
  type RunStatus,
  type RunSource,
} from "@/lib/types";

export type ShareSnapshot = {
  caseId: CaseId;
  version: PolicyVersion;
  source: RunSource;
  status: RunStatus;
  durationMs: number;
  passedCount: number;
  totalCount: number;
  failedLabels: string[];
  evidence: string;
};

export function buildSharePath(snapshot: ShareSnapshot): string {
  const params = new URLSearchParams({
    case: snapshot.caseId,
    version: snapshot.version,
    source: snapshot.source,
    status: snapshot.status,
    duration: String(snapshot.durationMs),
    passed: String(snapshot.passedCount),
    total: String(snapshot.totalCount),
  });
  if (snapshot.failedLabels.length > 0) {
    params.set("failed", snapshot.failedLabels.join("|"));
  }
  if (snapshot.evidence) {
    params.set("evidence", snapshot.evidence.slice(0, 180));
  }
  return `/r?${params.toString()}`;
}

export function snapshotFromRun(run: EvalRun): ShareSnapshot {
  const failed = run.assertions.filter((assertion) => !assertion.passed);
  return {
    caseId: run.caseId,
    version: run.version,
    source: run.source,
    status: run.status,
    durationMs: run.durationMs,
    passedCount: run.assertions.filter((assertion) => assertion.passed).length,
    totalCount: run.assertions.length,
    failedLabels: failed.map((assertion) => assertion.label),
    evidence: failed[0]?.evidence.split("\n")[0] ?? "",
  };
}

function isPolicyVersion(value: string | null): value is PolicyVersion {
  return value === "v1" || value === "v2";
}

function isRunStatus(value: string | null): value is RunStatus {
  return value === "pass" || value === "fail" || value === "error";
}

function isRunSource(value: string | null): value is RunSource {
  return value === "example" || value === "live";
}

export function parseShareParams(params: URLSearchParams): ShareSnapshot | null {
  const caseRaw = params.get("case");
  const versionRaw = params.get("version");
  if (!caseRaw || !isCaseId(caseRaw) || !isPolicyVersion(versionRaw)) return null;

  const sourceRaw = params.get("source");
  const statusRaw = params.get("status");
  const source: RunSource = isRunSource(sourceRaw) ? sourceRaw : "example";
  const example = getExampleRun(caseRaw, versionRaw);
  const status: RunStatus = isRunStatus(statusRaw) ? statusRaw : example.status;
  const durationRaw = Number(params.get("duration") ?? example.durationMs);
  const passedRaw = Number(params.get("passed") ?? NaN);
  const totalRaw = Number(params.get("total") ?? NaN);
  const failed = (params.get("failed") ?? "")
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
  const evidence = params.get("evidence")?.trim() ?? "";

  return {
    caseId: caseRaw,
    version: versionRaw,
    source,
    status,
    durationMs: Number.isFinite(durationRaw) ? durationRaw : 0,
    passedCount: Number.isFinite(passedRaw)
      ? passedRaw
      : example.assertions.filter((assertion) => assertion.passed).length,
    totalCount: Number.isFinite(totalRaw) ? totalRaw : example.assertions.length,
    failedLabels:
      failed.length > 0
        ? failed
        : example.assertions.filter((a) => !a.passed).map((a) => a.label),
    evidence:
      evidence ||
      example.assertions.find((assertion) => !assertion.passed)?.evidence.split("\n")[0] ||
      "",
  };
}

export function shareCardCopy(snapshot: ShareSnapshot): {
  title: string;
  description: string;
  scenarioName: string;
  policyTitle: string;
  policySummary: string;
} {
  const scenario = getScenario(snapshot.caseId);
  const policy = POLICIES[snapshot.version];
  const statusWord =
    snapshot.status === "pass" ? "passed" : snapshot.status === "fail" ? "failed" : "errored";
  return {
    title: `${scenario.name} · ${policy.title} ${statusWord}`,
    description:
      snapshot.failedLabels[0] ??
      snapshot.evidence ??
      `${snapshot.passedCount}/${snapshot.totalCount} assertions passed under ${policy.title}.`,
    scenarioName: scenario.name,
    policyTitle: policy.title,
    policySummary: policy.summary,
  };
}

export function defaultShareCase(): CaseId {
  return CASE_IDS[1];
}
