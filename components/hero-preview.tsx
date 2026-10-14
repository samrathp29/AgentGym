import { getExampleRun } from "@/lib/example-runs";
import { POLICIES } from "@/lib/policies";

export function HeroPreview() {
  const fail = getExampleRun("impatient-refund-request", "v1");
  const pass = getExampleRun("impatient-refund-request", "v2");
  const failed = fail.assertions.find((assertion) => !assertion.passed);

  return (
    <div
      className="hero-preview relative mt-10 overflow-hidden rounded-[22px] border border-[var(--border)] bg-white"
      aria-label="Product preview"
    >
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-[var(--border)] p-4 sm:p-5 lg:border-r lg:border-b-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Live product surface
            </p>
            <span className="rounded-full bg-[#f8e8ea] px-2 py-0.5 text-[10px] font-semibold text-[var(--failure)] uppercase">
              Fail
            </span>
          </div>
          <p className="text-[13px] font-medium text-[var(--ink)]">
            Impatient refund · {POLICIES.v1.title}
          </p>
          <ol className="mt-3 space-y-2">
            <li className="ml-auto max-w-[90%] rounded-[14px] bg-[var(--ink)] px-3 py-2 text-[12px] leading-4 text-white">
              {fail.transcript.find((event) => event.role === "customer")?.text}
            </li>
            <li className="max-w-[90%] rounded-[14px] bg-[var(--background)] px-3 py-2 text-[12px] leading-4 text-[var(--ink)] ring-1 ring-[var(--border)]">
              {fail.transcript.find((event) => event.role === "agent")?.text}
            </li>
            <li className="rounded-[14px] border border-[var(--failure)]/35 bg-[#fdf6f7] px-3 py-2 font-mono text-[11px] text-[#8a3d46]">
              issueRefund · blocked
              {failed ? (
                <span className="mt-1 block font-sans text-[11px] font-medium">
                  Failed: {failed.label.toLowerCase()}
                </span>
              ) : null}
            </li>
          </ol>
        </div>

        <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
              Prompt delta
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-[12px] bg-[#fdf6f7] px-3 py-2">
                <span className="text-[12px] text-[var(--ink)]">{POLICIES.v1.title}</span>
                <span className="text-[12px] font-semibold text-[var(--failure)]">
                  {fail.status}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-[12px] bg-[#e5f4ee] px-3 py-2">
                <span className="text-[12px] text-[var(--ink)]">{POLICIES.v2.title}</span>
                <span className="text-[12px] font-semibold text-[var(--success)]">
                  {pass.status}
                </span>
              </div>
            </div>
          </div>
          <div className="rounded-[14px] border border-[var(--border)] bg-[var(--background)] px-3 py-3">
            <p className="text-[11px] font-medium text-[var(--muted)]">What changed</p>
            <p className="mt-1 text-[13px] leading-5 text-[var(--ink)]">
              Verify first requires a successful order lookup before any refund attempt. Same
              fixtures. Different outcome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
