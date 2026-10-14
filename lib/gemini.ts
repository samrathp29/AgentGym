import "server-only";

import { GoogleGenAI, Type, type FunctionDeclaration } from "@google/genai";

export const DEFAULT_MODEL = "gemini-3.8-flash";

export const FALLBACK_MODELS = ["gemini-3.5-flash", "gemini-3.1-flash-lite"] as const;

export function getModelName(): string {
  return process.env["GEMINI_MODEL"]?.trim() || DEFAULT_MODEL;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env["GEMINI_API_KEY"]?.trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "lookupOrder",
    description:
      "Look up a fictional Aster Audio order. Succeeds only when both orderId and email match the mock record. A successful lookup is what counts as verification.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: {
          type: Type.STRING,
          description: "Order ID as stated by the customer, for example AA-10482.",
        },
        email: {
          type: Type.STRING,
          description: "Account email as stated by the customer.",
        },
      },
      required: ["orderId", "email"],
    },
  },
  {
    name: "issueRefund",
    description:
      "Attempt an automatic refund. The mock ledger blocks unverified, expired, and high-value orders. Calling this tool still counts as a refund attempt even when blocked.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: {
          type: Type.STRING,
          description: "Order ID to refund.",
        },
      },
      required: ["orderId"],
    },
  },
  {
    name: "createEscalation",
    description:
      "Open a ticket for a human specialist. Use this when verification fails, the customer refuses to verify, or policy requires human approval.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: {
          type: Type.STRING,
          description: "Related order ID if known.",
        },
        reason: {
          type: Type.STRING,
          description: "Short reason for the escalation.",
        },
      },
      required: ["reason"],
    },
  },
];
