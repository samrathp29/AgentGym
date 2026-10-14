import { POLICIES, policyLines } from "@/lib/policies";

export function PolicyDiff() {
  const baseline = policyLines("v1");
  const safeguard = policyLines("v2");
  const shared = new Set(baseline);

  return (
    <div className="space-y-3">
      <p className="text-[12px] leading-5 text-[var(--muted)]">
        Both versions share the Aster Audio desk. v2 adds authorization, tool sequencing, and
        confirmation rules. Comparison always uses the same case fixtures.
      </p>
      <div className="grid gap-3">
        <section className="rounded-[14px] border border-[var(--border)] bg-white p-3">
          <h3 className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            v1 · {POLICIES.v1.title}
          </h3>
          <pre className="mt-2 font-mono text-[11px] leading-4 text-[var(--ink)] whitespace-pre-wrap">
            {POLICIES.v1.systemInstruction}
          </pre>
        </section>
        <section className="rounded-[14px] border border-[var(--border)] bg-white p-3">
          <h3 className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
            v2 · {POLICIES.v2.title}
          </h3>
          <pre className="mt-2 font-mono text-[11px] leading-4 whitespace-pre-wrap">
            {safeguard.map((line) => {
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
