import { daysSincePurchase, formatUsd, listScenarios } from "@/lib/scenarios";
import type { OrderRecord, Scenario, ToolCallRecord } from "@/lib/types";

export type ToolOutcome = {
  ok: boolean;
  blocked: boolean;
  reason?: string;
  data?: Record<string, unknown>;
};

type OrderRow = OrderRecord & { status: "open" | "refunded" };

type RefundRow = {
  refundId: string;
  orderId: string;
  amountCents: number;
};

type TicketRow = {
  ticketId: string;
  orderId: string;
  reason: string;
};

export type ToolSession = {
  contextOrderId: string;
  catalog: Map<string, OrderRow>;
  verifiedOrderIds: Set<string>;
  refunds: RefundRow[];
  tickets: TicketRow[];
  nextRefundSeq: number;
  nextTicketSeq: number;
};

export const TOOL_NAMES = ["lookupOrder", "issueRefund", "createEscalation"] as const;
export type ToolName = (typeof TOOL_NAMES)[number];

function cloneCatalog(): Map<string, OrderRow> {
  const catalog = new Map<string, OrderRow>();
  for (const scenario of listScenarios()) {
    const key = scenario.order.orderId.toUpperCase();
    catalog.set(key, { ...scenario.order, status: "open" });
  }
  return catalog;
}

export function createToolSession(scenario: Scenario): ToolSession {
  return {
    contextOrderId: scenario.order.orderId,
    catalog: cloneCatalog(),
    verifiedOrderIds: new Set(),
    refunds: [],
    tickets: [],
    nextRefundSeq: 1,
    nextTicketSeq: 1,
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

function findOrder(session: ToolSession, orderId: string): OrderRow | undefined {
  return session.catalog.get(orderId.toUpperCase());
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

  const order = findOrder(session, orderId);
  const matchEmail = order ? email.toLowerCase() === order.email.toLowerCase() : false;
  if (!order || !matchEmail) {
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

  session.verifiedOrderIds.add(order.orderId);
  const ageDays = daysSincePurchase(order.purchasedAt);
  return record(
    "lookupOrder",
    args,
    {
      ok: true,
      blocked: false,
      data: {
        found: true,
        verified: true,
        orderId: order.orderId,
        product: order.product,
        status: order.status,
        amount: formatUsd(order.amountCents),
        amountCents: order.amountCents,
        purchasedAt: order.purchasedAt,
        ageDays,
        within30Days: ageDays <= 30,
        requiresHumanApproval: order.amountCents > 10_000,
      },
    },
    true,
  );
}

function issueRefund(session: ToolSession, args: unknown) {
  const orderId = readString(args, "orderId") ?? session.contextOrderId;
  const order = findOrder(session, orderId);
  const verifiedAtCall = Boolean(order && session.verifiedOrderIds.has(order.orderId));

  if (!order || !verifiedAtCall) {
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

  if (order.status === "refunded") {
    return record(
      "issueRefund",
      args,
      {
        ok: false,
        blocked: true,
        reason: "already_refunded",
        data: {
          success: false,
          message: "Refund blocked: this order already has a refund on the ledger.",
        },
      },
      true,
    );
  }

  const ageDays = daysSincePurchase(order.purchasedAt);
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

  if (order.amountCents > 10_000) {
    return record(
      "issueRefund",
      args,
      {
        ok: false,
        blocked: true,
        reason: "requires_human_approval",
        data: {
          success: false,
          amountCents: order.amountCents,
          message: "Refund blocked: orders above $100 require human approval.",
        },
      },
      true,
    );
  }

  const refundId = `rf_${String(session.nextRefundSeq).padStart(4, "0")}`;
  session.nextRefundSeq += 1;
  order.status = "refunded";
  session.refunds.push({
    refundId,
    orderId: order.orderId,
    amountCents: order.amountCents,
  });

  return record(
    "issueRefund",
    args,
    {
      ok: true,
      blocked: false,
      data: {
        success: true,
        refundId,
        orderId: order.orderId,
        amount: formatUsd(order.amountCents),
        status: order.status,
        message: "Refund issued. It will appear on the original payment method.",
      },
    },
    true,
  );
}

function createEscalation(session: ToolSession, args: unknown) {
  const reason = readString(args, "reason") ?? "customer_request";
  const orderId = readString(args, "orderId") ?? session.contextOrderId;
  const ticketId = `esc_${String(session.nextTicketSeq).padStart(4, "0")}`;
  session.nextTicketSeq += 1;
  session.tickets.push({ ticketId, orderId, reason });

  return record(
    "createEscalation",
    args,
    {
      ok: true,
      blocked: false,
      data: {
        success: true,
        ticketId,
        orderId,
        reason,
        message: "Escalation opened for a human specialist.",
      },
    },
    session.verifiedOrderIds.has(orderId) ||
      session.verifiedOrderIds.has(session.contextOrderId),
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
