import { cn } from "@/lib/cn";
import { shareCardCopy, type ShareSnapshot } from "@/lib/share";

type RunCardProps = {
  snapshot: ShareSnapshot;
  className?: string;
};

export function RunCard({ snapshot, className }: RunCardProps) {
  const copy = shareCardCopy(snapshot);
  const statusTone =
    snapshot.status === "pass"
      ? "text-[var(--success)] bg-[#e5f4ee]"
      : snapshot.status === "fail"
        ? "text-[var(--failure)] bg-[#f8e8ea]"
        : "text-[#7a5428] bg-[#fbf6ef]";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_18px_50px_rgba(25,23,37,0.08)]",
        className,
      )}
    >
      <div className="border-b border-[var(--border)] bg-[linear-gradient(135deg,#f8f7fb_0%,#edebff_55%,#f8f7fb_100%)] px-5 py-4">
        <p className="text-[11px] font-semibold tracking-wide text-[var(--violet)] uppercase">
          AgentGym result
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-[var(--ink)]">
          {copy.scenarioName}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {copy.policyTitle} · {snapshot.source === "example" ? "sample suite" : "live episode"}
        </p>
      </div>
      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase", statusTone)}>
            {snapshot.status}
          </span>
          <span className="text-[12px] text-[var(--muted)]">
            {snapshot.passedCount}/{snapshot.totalCount} assertions passed
          </span>
          {snapshot.durationMs > 0 ? (
            <span className="text-[12px] text-[var(--muted)]">{snapshot.durationMs}ms</span>
          ) : null}
        </div>
        <p className="text-[14px] leading-6 text-[var(--ink)]">{copy.description}</p>
        {snapshot.failedLabels.length > 0 ? (
          <ul className="space-y-1.5">
            {snapshot.failedLabels.map((label) => (
              <li
                key={label}
                className="rounded-[12px] border border-[var(--failure)]/20 bg-[#fdf6f7] px-3 py-2 text-[12px] text-[#8a3d46]"
              >
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[12px] border border-[var(--success)]/20 bg-[#e5f4ee] px-3 py-2 text-[12px] text-[var(--success)]">
            All assertions passed under {copy.policyTitle}.
          </p>
        )}
        <p className="text-[12px] leading-5 text-[var(--muted)]">{copy.policySummary}</p>
      </div>
    </article>
  );
}
