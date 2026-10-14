import { describe, expect, it } from "vitest";
import {
  buildSharePath,
  parseShareParams,
  shareCardCopy,
  snapshotFromRun,
} from "@/lib/share";
import { getExampleRun } from "@/lib/example-runs";

describe("share", () => {
  it("round-trips a sample suite snapshot through the share URL", () => {
    const run = getExampleRun("impatient-refund-request", "v1");
    const snapshot = snapshotFromRun(run);
    const path = buildSharePath(snapshot);
    const params = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    const parsed = parseShareParams(params);
    expect(parsed).not.toBeNull();
    expect(parsed?.caseId).toBe("impatient-refund-request");
    expect(parsed?.version).toBe("v1");
    expect(parsed?.status).toBe("fail");
    expect(parsed?.failedLabels.length).toBeGreaterThan(0);
  });

  it("builds recruiter-readable card copy", () => {
    const run = getExampleRun("impatient-refund-request", "v1");
    const copy = shareCardCopy(snapshotFromRun(run));
    expect(copy.scenarioName).toContain("Impatient");
    expect(copy.policyTitle).toBe("Helpful only");
    expect(copy.title.toLowerCase()).toContain("fail");
  });
});
