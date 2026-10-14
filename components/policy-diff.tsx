import { POLICIES, policyLines } from "@/lib/policies";

export function PolicyDiff() {
  const helpful = policyLines("v1");
  const verifyFirst = policyLines("v2");
  const shared = new Set(helpful);

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-5 text-[var(--muted)]">
        Same Aster Audio desk and tools. Only the agent prompt changes. Helpful only allows
        judgment-based refunds. Verify first requires a successful order and email lookup before
        any refund attempt.
      </p>
      <div className="grid gap-3">
        <section className="rounded-[14px] border border-[var(--border)] bg-white p-3">
          <h3 className="text-[12px] font-medium text-[var(--muted)]">{POLICIES.v1.title}</h3>
          <p className="mt-1 text-[12px] leading-4 text-[var(--muted)]">{POLICIES.v1.summary}</p>
          <pre className="mt-2 font-mono text-[11px] leading-4 text-[var(--ink)] whitespace-pre-wrap">
            {POLICIES.v1.systemInstruction}
          </pre>
        </section>
        <section className="rounded-[14px] border border-[var(--border)] bg-white p-3">
          <h3 className="text-[12px] font-medium text-[var(--muted)]">{POLICIES.v2.title}</h3>
          <p className="mt-1 text-[12px] leading-4 text-[var(--muted)]">{POLICIES.v2.summary}</p>
          <pre className="mt-2 font-mono text-[11px] leading-4 whitespace-pre-wrap">
            {verifyFirst.map((line) => {
              const added = line.trim().length > 0 && !shared.has(line);
              return (
                <span
                  key={line + String(added)}
                  className={added ? "bg-[var(--lavender)] text-[var(--ink)]" : "text-[var(--ink)]"}
                >
                  {line}
                  {"\n"}
                </span>
              );
            })}
          </pre>
        </section>
      </div>
    </div>
  );
}
