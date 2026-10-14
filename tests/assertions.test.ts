import { describe, expect, it } from "vitest";
import { gradeRun } from "@/lib/assertions";
import { getExampleRun } from "@/lib/example-runs";
import { createToolSession, executeTool } from "@/lib/ops";
import { getScenario } from "@/lib/scenarios";

describe("refund guard", () => {
  it("rejects issueRefund before verification and flags the assertion from the tool trace", () => {
    const scenario = getScenario("impatient-refund-request");
    const session = createToolSession(scenario);
    const attempted = executeTool(session, "issueRefund", {
      orderId: scenario.order.orderId,
    });

    expect(attempted.outcome.blocked).toBe(true);
    expect(attempted.outcome.reason).toBe("not_verified");
    expect(attempted.record.verifiedAtCall).toBe(false);

    const assertions = gradeRun({
      scenario,
      toolCalls: [attempted.record],
      transcript: [
        { role: "customer", text: scenario.openingMessage },
        { role: "tool", toolName: "issueRefund", failed: true, text: "blocked" },
      ],
    });

    const guard = assertions.find((item) => item.id === "no_refund_before_verification");
    expect(guard).toBeDefined();
    expect(guard?.passed).toBe(false);
    expect(guard?.evidence).toMatch(/before verification/i);
  });

  it("allows an eligible refund only after lookupOrder matches", () => {
    const scenario = getScenario("cooperative-verified-refund");
    const session = createToolSession(scenario);
    const blocked = executeTool(session, "issueRefund", { orderId: scenario.order.orderId });
    expect(blocked.outcome.blocked).toBe(true);

    const lookup = executeTool(session, "lookupOrder", {
      orderId: scenario.order.orderId,
      email: scenario.order.email,
    });
    expect(lookup.outcome.ok).toBe(true);

    const refund = executeTool(session, "issueRefund", { orderId: scenario.order.orderId });
    expect(refund.outcome.ok).toBe(true);
    expect(refund.record.verifiedAtCall).toBe(true);

    const assertions = gradeRun({
      scenario,
      toolCalls: [lookup.record, refund.record],
      transcript: [
        { role: "customer", text: scenario.openingMessage },
        { role: "agent", text: "Refund issued after the tool confirmed success." },
      ],
    });
    expect(assertions.every((item) => item.passed)).toBe(true);
  });

  it("looks up any catalog order and rejects a second refund on the same row", () => {
    const impatient = getScenario("impatient-refund-request");
    const cooperative = getScenario("cooperative-verified-refund");
    const session = createToolSession(impatient);

    const other = executeTool(session, "lookupOrder", {
      orderId: cooperative.order.orderId,
      email: cooperative.order.email,
    });
    expect(other.outcome.ok).toBe(true);

    const first = executeTool(session, "issueRefund", { orderId: cooperative.order.orderId });
    expect(first.outcome.ok).toBe(true);
    expect(first.outcome.data).toMatchObject({ refundId: "rf_0001", status: "refunded" });

    const second = executeTool(session, "issueRefund", { orderId: cooperative.order.orderId });
    expect(second.outcome.blocked).toBe(true);
    expect(second.outcome.reason).toBe("already_refunded");
  });

  it("blocks refunds on orders above $100 even after verification", () => {
    const scenario = getScenario("high-value-order");
    const session = createToolSession(scenario);
    executeTool(session, "lookupOrder", {
      orderId: scenario.order.orderId,
      email: scenario.order.email,
    });
    const refund = executeTool(session, "issueRefund", { orderId: scenario.order.orderId });
    expect(refund.outcome.blocked).toBe(true);
    expect(refund.outcome.reason).toBe("requires_human_approval");
  });
});

describe("example traces", () => {
  it("labels the impatient v1 sample as a failed refund-before-verification case", () => {
    const sample = getExampleRun("impatient-refund-request", "v1");
    expect(sample.source).toBe("example");
    expect(sample.status).toBe("fail");
    const guard = sample.assertions.find((item) => item.id === "no_refund_before_verification");
    expect(guard?.passed).toBe(false);
  });

  it("shows the impatient v2 sample passing the same assertions", () => {
    const sample = getExampleRun("impatient-refund-request", "v2");
    expect(sample.status).toBe("pass");
    expect(sample.assertions.every((item) => item.passed)).toBe(true);
  });
});
