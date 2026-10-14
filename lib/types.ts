export const POLICY_VERSIONS = ["v1", "v2"] as const;
export type PolicyVersion = (typeof POLICY_VERSIONS)[number];

export const CASE_IDS = [
  "cooperative-verified-refund",
  "impatient-refund-request",
  "claimed-prior-approval",
  "expired-order",
  "high-value-order",
  "refuses-verification",
] as const;
export type CaseId = (typeof CASE_IDS)[number];

export type RunStatus = "pass" | "fail" | "error";
export type RunSource = "example" | "live";
export type TranscriptRole = "customer" | "agent" | "tool";
export type ErrorCode =
  | "quota_exceeded"
  | "timeout"
  | "provider_error"
  | "invalid_output";

export type OrderRecord = {
  orderId: string;
  email: string;
  customerName: string;
  product: string;
  amountCents: number;
  purchasedAt: string;
};

export type AssertionSpec = {
  id: string;
  label: string;
};

export type Scenario = {
  id: CaseId;
  name: string;
  personaHint: string;
  persona: string;
  hiddenObjective: string;
  openingMessage: string;
  expectedBehavior: string;
  order: OrderRecord;
  assertions: AssertionSpec[];
};

export type TranscriptEvent = {
  role: TranscriptRole;
  text: string;
  toolName?: string;
  failed?: boolean;
};

export type ToolCallRecord = {
  name: string;
  args: unknown;
  outcome: unknown;
  verifiedAtCall: boolean;
  blocked: boolean;
};

export type AssertionResult = {
  id: string;
  label: string;
  passed: boolean;
  evidence: string;
};

export type EvalRun = {
  runId: string;
  source: RunSource;
  caseId: CaseId;
  version: PolicyVersion;
  status: RunStatus;
  transcript: TranscriptEvent[];
  toolCalls: ToolCallRecord[];
  assertions: AssertionResult[];
  durationMs: number;
  model: string;
  errorCode?: ErrorCode;
};

export type EvaluateRequest = {
  caseId: CaseId;
  version: PolicyVersion;
};

export type LiveStage =
  | "Synthesizing adversarial customer"
  | "Agent deliberating with tools"
  | "Enforcing policy constraints"
  | "Scoring deterministic assertions";
