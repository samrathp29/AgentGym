import { evaluateCase, TIMEOUT_MS } from "@/lib/evaluate";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { isCaseId } from "@/lib/scenarios";
import type { EvalRun, LiveStage, PolicyVersion } from "@/lib/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isPolicyVersion(value: unknown): value is PolicyVersion {
  return value === "v1" || value === "v2";
}

function ndjson(encoder: TextEncoder, payload: unknown): Uint8Array {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("caseId" in body) ||
    !("version" in body) ||
    !isCaseId(body.caseId) ||
    !isPolicyVersion(body.version)
  ) {
    return Response.json(
      { error: "invalid_request", message: "Body must be { caseId, version: \"v1\" | \"v2\" } with a known scenario." },
      { status: 400 },
    );
  }

  const limit = checkRateLimit(clientKey(request));
  if (!limit.ok) {
    return Response.json(
      {
        runId: "rate_limited",
        source: "live",
        caseId: body.caseId,
        version: body.version,
        status: "error",
        transcript: [],
        toolCalls: [],
        assertions: [],
        durationMs: 0,
        model: process.env["GEMINI_MODEL"] ?? "gemini-3.8-flash",
        errorCode: "quota_exceeded",
        message: `Live evaluations are limited to one concurrent episode. Retry in ${limit.retryAfterSec}s, or explore the curated example traces.`,
      } satisfies EvalRun & { message: string },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  const encoder = new TextEncoder();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const caseId = body.caseId;
  const version = body.version;

  const stream = new ReadableStream({
    async start(streamController) {
      const send = (payload: unknown) => {
        streamController.enqueue(ndjson(encoder, payload));
      };
      try {
        const run = await evaluateCase({
          caseId,
          version,
          signal: controller.signal,
          onStage: (stage: LiveStage) => {
            send({ type: "stage", stage });
          },
        });
        send({ type: "result", run });
      } catch {
        send({
          type: "result",
          run: {
            runId: "stream_error",
            source: "live",
            caseId,
            version,
            status: "error",
            transcript: [],
            toolCalls: [],
            assertions: [],
            durationMs: 0,
            model: process.env["GEMINI_MODEL"] ?? "gemini-3.8-flash",
            errorCode: "provider_error",
          } satisfies EvalRun,
        });
      } finally {
        clearTimeout(timer);
        streamController.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
