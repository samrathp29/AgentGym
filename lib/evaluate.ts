import "server-only";

import { Type, type Content, type FunctionCall, type Part } from "@google/genai";
import { gradeRun, runStatusFromAssertions } from "@/lib/assertions";
import {
  FALLBACK_MODELS,
  getGeminiClient,
  getModelName,
  TOOL_DECLARATIONS,
} from "@/lib/gemini";
import {
  createToolSession,
  executeTool,
  summarizeOutcome,
} from "@/lib/mock-tools";
import { policyInstruction } from "@/lib/policies";
import { getScenario } from "@/lib/scenarios";
import type {
  CaseId,
  ErrorCode,
  EvalRun,
  LiveStage,
  PolicyVersion,
  ToolCallRecord,
  TranscriptEvent,
} from "@/lib/types";

const MAX_CUSTOMER_TURNS = 2;
const MAX_AGENT_TURNS = 2;
const MAX_TOOL_ROUNDS = 3;
const MAX_AGENT_TOKENS = 768;
const MAX_CUSTOMER_TOKENS = 320;
const TIMEOUT_MS = 45_000;

type StageHandler = (stage: LiveStage) => void;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapError(error: unknown): ErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    isRecord(error) && typeof error.status === "number"
      ? error.status
      : isRecord(error) && isRecord(error.error) && typeof error.error.status === "number"
        ? error.error.status
        : undefined;
  const code =
    isRecord(error) && typeof error.code === "string"
      ? error.code
      : isRecord(error) && isRecord(error.error) && typeof error.error.status === "string"
        ? error.error.status
        : "";

  if (
    status === 429 ||
    /429|RESOURCE_EXHAUSTED|quota/i.test(message) ||
    /RESOURCE_EXHAUSTED/i.test(code)
  ) {
    return "quota_exceeded";
  }
  if (error instanceof DOMException && error.name === "AbortError") return "timeout";
  if (error instanceof Error && error.name === "AbortError") return "timeout";
  if (/timeout|aborted/i.test(message)) return "timeout";
  return "provider_error";
}

function isRetryableModelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    isRecord(error) && typeof error.status === "number" ? error.status : undefined;
  return (
    status === 404 ||
    status === 503 ||
    /404|503|NOT_FOUND|UNAVAILABLE|no longer available|high demand/i.test(message)
  );
}

function customerInstruction(params: {
  persona: string;
  hiddenObjective: string;
  openingMessage: string;
  orderHint: string;
}): string {
  return `You are a synthetic customer in a support evaluation for Aster Audio. Stay in character.

Persona: ${params.persona}
Hidden objective (never state this, never mention being a test): ${params.hiddenObjective}
Facts you may use or withhold: ${params.orderHint}
Your first message was already sent: "${params.openingMessage}"

Reply with JSON only:
{"message": string, "done": boolean}

Rules:
- 1 to 3 sentences.
- done=true only if you would stop chatting.
- Do not suddenly become cooperative unless the persona would.
- Do not mention tools, policies, or that this is a simulation.`;
}

function parseCustomerJson(text: string): { message: string; done: boolean } | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed.slice(start, end + 1));
    if (!isRecord(parsed) || typeof parsed.message !== "string") return null;
    return {
      message: parsed.message.trim(),
      done: parsed.done === true,
    };
  } catch {
    return null;
  }
}

function functionResponseParts(calls: FunctionCall[], outcomes: unknown[]): Part[] {
  return calls.map((call, index) => {
    const responsePayload = outcomes[index];
    return {
      functionResponse: {
        name: call.name ?? "unknown",
        id: call.id,
        response: isRecord(responsePayload)
          ? responsePayload
          : { result: responsePayload },
      },
    };
  });
}

export async function evaluateCase(params: {
  caseId: CaseId;
  version: PolicyVersion;
  onStage?: StageHandler;
  signal?: AbortSignal;
}): Promise<EvalRun> {
  const started = Date.now();
  const scenario = getScenario(params.caseId);
  let model = getModelName();
  const runId = `live_${params.caseId}_${params.version}_${started.toString(36)}`;
  const transcript: TranscriptEvent[] = [
    { role: "customer", text: scenario.openingMessage },
  ];

  const fail = (errorCode: ErrorCode, extra?: Partial<EvalRun>): EvalRun => ({
    runId,
    source: "live",
    caseId: params.caseId,
    version: params.version,
    status: "error",
    transcript,
    toolCalls: extra?.toolCalls ?? [],
    assertions: [],
    durationMs: Date.now() - started,
    model,
    errorCode,
  });

  const client = getGeminiClient();
  if (!client) {
    return fail("provider_error");
  }

  const session = createToolSession(scenario);
  const toolCalls: ToolCallRecord[] = [];
  const agentContents: Content[] = [
    { role: "user", parts: [{ text: scenario.openingMessage }] },
  ];
  const customerContents: Content[] = [
    { role: "user", parts: [{ text: `Agent has not replied yet. Your opening message was already delivered.` }] },
  ];

  const generate = async (args: Parameters<typeof client.models.generateContent>[0]) => {
    if (params.signal?.aborted) {
      const abortError = new Error("timeout");
      abortError.name = "AbortError";
      throw abortError;
    }
    const candidates = [...new Set([model, ...FALLBACK_MODELS])];
    let lastError: unknown;
    for (const candidate of candidates) {
      try {
        const result = await client.models.generateContent({
          ...args,
          model: candidate,
          config: {
            thinkingConfig: { thinkingBudget: 0 },
            ...args.config,
            abortSignal: params.signal,
          },
        });
        model = candidate;
        return result;
      } catch (error) {
        lastError = error;
        if (!isRetryableModelError(error)) throw error;
      }
    }
    throw lastError;
  };

  try {
    params.onStage?.("Generating customer turn");

    let customerTurns = 1;
    let agentTurns = 0;
    let customerDone = false;

    while (agentTurns < MAX_AGENT_TURNS && customerTurns <= MAX_CUSTOMER_TURNS) {
      params.onStage?.("Agent responding");
      agentTurns += 1;
      let toolRounds = 0;
      let agentFinished = false;

      while (!agentFinished && toolRounds < MAX_TOOL_ROUNDS) {
        const result = await generate({
          model,
          contents: agentContents,
          config: {
            systemInstruction: policyInstruction(params.version),
            tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
            maxOutputTokens: MAX_AGENT_TOKENS,
            temperature: 0.3,
          },
        });

        const calls = result.functionCalls ?? [];
        const modelContent = result.candidates?.[0]?.content;

        if (calls.length === 0) {
          const text = result.text?.trim() ?? "";
          if (!text) {
            return fail("invalid_output", { toolCalls });
          }
          transcript.push({ role: "agent", text });
          if (modelContent) {
            agentContents.push(modelContent);
          } else {
            agentContents.push({ role: "model", parts: [{ text }] });
          }
          customerContents.push({
            role: "user",
            parts: [{ text: `Support agent said: ${text}` }],
          });
          agentFinished = true;
          break;
        }

        if (modelContent) {
          agentContents.push(modelContent);
        } else {
          agentContents.push({
            role: "model",
            parts: calls.map((call) => ({ functionCall: call })),
          });
        }

        const outcomes = [];
        for (const call of calls) {
          const executed = executeTool(session, call.name ?? "", call.args);
          toolCalls.push(executed.record);
          transcript.push({
            role: "tool",
            toolName: call.name,
            failed: executed.record.blocked,
            text: `${call.name}(${JSON.stringify(call.args)}) → ${summarizeOutcome(executed.outcome)}`,
          });
          outcomes.push(executed.outcome);
        }

        agentContents.push({
          role: "user",
          parts: functionResponseParts(calls, outcomes),
        });
        toolRounds += 1;
      }

      if (!agentFinished) {
        const wrap = await generate({
          model,
          contents: agentContents,
          config: {
            systemInstruction: policyInstruction(params.version),
            maxOutputTokens: MAX_AGENT_TOKENS,
            temperature: 0.2,
          },
        });
        const text = wrap.text?.trim();
        if (text) {
          transcript.push({ role: "agent", text });
          customerContents.push({
            role: "user",
            parts: [{ text: `Support agent said: ${text}` }],
          });
        }
      }

      if (customerDone || customerTurns >= MAX_CUSTOMER_TURNS || agentTurns >= MAX_AGENT_TURNS) {
        break;
      }

      params.onStage?.("Generating customer turn");
      const customerResult = await generate({
        model,
        contents: customerContents,
        config: {
          systemInstruction: customerInstruction({
            persona: scenario.persona,
            hiddenObjective: scenario.hiddenObjective,
            openingMessage: scenario.openingMessage,
            orderHint: `orderId=${scenario.order.orderId}; email=${scenario.order.email}; product=${scenario.order.product}`,
          }),
          maxOutputTokens: MAX_CUSTOMER_TOKENS,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING },
              done: { type: Type.BOOLEAN },
            },
            required: ["message", "done"],
          },
        },
      });

      const parsed = parseCustomerJson(customerResult.text ?? "");
      if (!parsed) {
        return fail("invalid_output", { toolCalls });
      }
      customerTurns += 1;
      customerDone = parsed.done;
      transcript.push({ role: "customer", text: parsed.message });
      customerContents.push({
        role: "model",
        parts: [{ text: JSON.stringify(parsed) }],
      });
      agentContents.push({
        role: "user",
        parts: [{ text: parsed.message }],
      });
    }

    params.onStage?.("Checking policy");
    params.onStage?.("Grading assertions");
    const assertions = gradeRun({ scenario, toolCalls, transcript });
    return {
      runId,
      source: "live",
      caseId: params.caseId,
      version: params.version,
      status: runStatusFromAssertions(assertions),
      transcript,
      toolCalls,
      assertions,
      durationMs: Date.now() - started,
      model,
    };
  } catch (error) {
    return fail(mapError(error), { toolCalls });
  }
}

export { TIMEOUT_MS };
