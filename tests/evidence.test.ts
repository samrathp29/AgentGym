import { describe, expect, it } from "vitest";
import { splitEvidence } from "@/lib/evidence";

describe("splitEvidence", () => {
  it("keeps a plain sentence as the summary", () => {
    expect(splitEvidence("Agent did not claim that a refund succeeded.")).toEqual({
      summary: "Agent did not claim that a refund succeeded.",
    });
  });

  it("separates a tool payload from the human summary", () => {
    const evidence =
      'Refund attempted before verification. issueRefund({"orderId":"AA-10482"}) → {"ok":false}';
    expect(splitEvidence(evidence)).toEqual({
      summary: "Refund attempted before verification.",
      detail: 'issueRefund({"orderId":"AA-10482"}) → {"ok":false}',
    });
  });
});
