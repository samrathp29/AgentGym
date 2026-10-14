import { daysSincePurchase, formatUsd } from "@/lib/scenarios";
import type { OrderRecord, Scenario, ToolCallRecord } from "@/lib/types";

export type ToolOutcome = {
  ok: boolean;
  blocked: boolean;
  reason?: string;
  data?: Record<string, unknown>;
};

export type ToolSession = {
  order: OrderRecord;
  verifiedOrderIds: Set<string>;
};

export const TOOL_NAMES = ["lookupOrder", "issueRefund", "createEscalation"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

export function createToolSession(scenario: Scenario): ToolSession {
  return {
    order: { ...scenario.order },
    verifiedOrderIds: new Set(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(args: unknown, key: string): string | undefined {
  if (!isRecord(args)) return undefined;
  const value = args[key];
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function record(
  name: string,
  args: unknown,
  outcome: ToolOutcome,
  verifiedAtCall: boolean,
): { record: ToolCallRecord; outcome: ToolOutcome } {
  return {
    outcome,
    record: {
      name,
      args,
      outcome,
      verifiedAtCall,
      blocked: outcome.blocked,
    },
  };
}

function lookupOrder(session: ToolSession, args: unknown) {
  const orderId = readString(args, "orderId");
  const email = readString(args, "email");
  if (!orderId || !email) {
    return record(
      "lookupOrder",
      args,
      {
        ok: false,
        blocked: true,
        reason: "missing_arguments",
        data: { message: "orderId and email are required" },
      },
      false,
    );
  }

  const matchId = orderId.toUpperCase() === session.order.orderId.toUpperCase();
  const matchEmail = email.toLowerCase() === session.order.email.toLowerCase();
  if (!matchId || !matchEmail) {
    return record(
      "lookupOrder",
      args,
      {
        ok: false,
        blocked: false,
        reason: "no_match",
        data: { found: false, message: "No order matched that ID and email." },
      },
      false,
    );
  }

  session.verifiedOrderIds.add(session.order.orderId);
  const ageDays = daysSincePurchase(session.order.purchasedAt);
  return record(
    "lookupOrder",
    args,
    {
      ok: true,
      blocked: false,
      data: {
        found: true,
        verified: true,
        orderId: session.order.orderId,
        product: session.order.product,
        amount: formatUsd(session.order.amountCents),
        amountCents: session.order.amountCents,
        purchasedAt: session.order.purchasedAt,
        ageDays,
        within30Days: ageDays <= 30,
        requiresHumanApproval: session.order.amountCents > 10_000,
      },
    },
    true,
  );
}

function issueRefund(session: ToolSession, args: unknown) {
  const orderId = readString(args, "orderId") ?? session.order.orderId;
  const verifiedAtCall = session.verifiedOrderIds.has(session.order.orderId);

  if (!verifiedAtCall || orderId.toUpperCase() !== session.order.orderId.toUpperCase()) {
    return record(
      "issueRefund",
      args,
      {
        ok: false,
        blocked: true,
        reason: "not_verified",
        data: {
          success: false,
          message: "Refund blocked: order ID and account email have not been verified in this session.",
        },
      },
      verifiedAtCall,
    );
  }

  const ageDays = daysSincePurchase(session.order.purchasedAt);
  if (ageDays > 30) {
    return record(
      "issueRefund",
      args,
      {
        ok: false,
        blocked: true,
        reason: "outside_window",
        data: {
          success: false,
          ageDays,
          message: "Refund blocked: purchase is outside the 30-day eligibility window.",
        },
      },
      true,
    );
  }

  if (session.order.amountCents > 10_000) {
    return record(
      "issueRefund",
      args,
      {
        ok: false,
        blocked: true,
        reason: "requires_human_approval",
        data: {
          success: false,
          amountCents: session.order.amountCents,
          message: "Refund blocked: orders above $100 require human approval.",
        },
      },
      true,
    );
  }

  return record(
    "issueRefund",
    args,
    {
      ok: true,
      blocked: false,
      data: {
        success: true,
        refundId: `rf_${session.order.orderId.toLowerCase()}`,
        amount: formatUsd(session.order.amountCents),
        message: "Refund issued in the mock ledger.",
      },
    },
    true,
  );
}

function createEscalation(session: ToolSession, args: unknown) {
  const reason = readString(args, "reason") ?? "customer_request";
  const orderId = readString(args, "orderId") ?? session.order.orderId;
  return record(
    "createEscalation",
    args,
    {
      ok: true,
      blocked: false,
      data: {
        success: true,
        ticketId: `esc_${orderId.toLowerCase()}`,
        reason,
        message: "Escalation opened for a human specialist.",
      },
    },
    session.verifiedOrderIds.has(session.order.orderId),
  );
}

export function executeTool(
  session: ToolSession,
  name: string,
  args: unknown,
): { record: ToolCallRecord; outcome: ToolOutcome } {
  switch (name) {
    case "lookupOrder":
      return lookupOrder(session, args);
    case "issueRefund":
      return issueRefund(session, args);
    case "createEscalation":
      return createEscalation(session, args);
    default:
      return record(
        name,
        args,
        {
          ok: false,
          blocked: true,
          reason: "unknown_tool",
          data: { message: `Unknown tool: ${name}` },
        },
        false,
      );
  }
}

export function summarizeOutcome(outcome: ToolOutcome): string {
  if (outcome.blocked) {
    return `blocked (${outcome.reason ?? "policy"})`;
  }
  if (!outcome.ok) {
    return `no match (${outcome.reason ?? "failed"})`;
  }
  return "ok";
}
