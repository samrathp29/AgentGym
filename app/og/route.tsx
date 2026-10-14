import { ImageResponse } from "next/og";
import { defaultShareCase, parseShareParams, shareCardCopy } from "@/lib/share";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const snapshot =
    parseShareParams(searchParams) ??
    parseShareParams(
      new URLSearchParams({
        case: defaultShareCase(),
        version: "v1",
        source: "example",
        status: "fail",
      }),
    );

  if (!snapshot) {
    return new Response("Missing share params", { status: 400 });
  }

  const copy = shareCardCopy(snapshot);
  const statusColor =
    snapshot.status === "pass" ? "#16876a" : snapshot.status === "fail" ? "#d15b66" : "#7a5428";
  const statusBg =
    snapshot.status === "pass" ? "#e5f4ee" : snapshot.status === "fail" ? "#f8e8ea" : "#fbf6ef";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f8f7fb 0%, #edebff 48%, #f8f7fb 100%)",
          padding: 64,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          color: "#191725",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              color: "#6555e8",
              letterSpacing: 1,
            }}
          >
            AGENTGYM
          </div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
            {copy.scenarioName}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#79758a" }}>
            {copy.policyTitle} · {snapshot.source === "example" ? "sample suite" : "live episode"}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              background: statusBg,
              color: statusColor,
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 28,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {snapshot.status}
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#79758a" }}>
            {snapshot.passedCount}/{snapshot.totalCount} assertions ·{" "}
            {(copy.description ?? "").slice(0, 72)}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
