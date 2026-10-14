import type { EvalRun } from "@/lib/types";

export function computeStats(runs: EvalRun[]): {
  passRate: number;
  failedAssertions: number;
  totalTests: number;
} {
  const countable = runs.filter((run) => run.status !== "error");
  const passed = countable.filter((run) => run.status === "pass").length;
  const failedAssertions = countable.reduce(
    (count, run) => count + run.assertions.filter((assertion) => !assertion.passed).length,
    0,
  );
  return {
    passRate: countable.length === 0 ? 0 : passed / countable.length,
    failedAssertions,
    totalTests: countable.length,
  };
}

export function formatPassRate(rate: number): string {
  if (!Number.isFinite(rate)) return "n/a";
  return `${Math.round(rate * 100)}%`;
}

export function copySummary(run: EvalRun): string {
  const failed = run.assertions.filter((assertion) => !assertion.passed);
  const lines = [
    "AgentGym · Aster Audio refund desk",
    `Case: ${run.caseId}`,
    `Policy: ${run.version} · ${run.source === "example" ? "Example run" : "Live run"}`,
    `Status: ${run.status.toUpperCase()}`,
    `Model: ${run.model}`,
    run.durationMs ? `Duration: ${run.durationMs}ms` : null,
    `Assertions: ${run.assertions.filter((assertion) => assertion.passed).length}/${run.assertions.length} passed`,
    failed.length > 0
      ? `Failed: ${failed.map((assertion) => assertion.label).join("; ")}`
      : "No failed assertions.",
  ];
  return lines.filter((line): line is string => line !== null).join("\n");
}
