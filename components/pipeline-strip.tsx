const STEPS = [
  "Adversarial customer",
  "Support agent",
  "Live tools",
  "Deterministic grader",
] as const;

export function PipelineStrip() {
  return (
    <section className="px-4 pb-8 sm:px-6" aria-label="Evaluation pipeline">
      <div className="mx-auto max-w-[1440px]">
        <ol className="flex flex-col gap-2 rounded-[16px] border border-[var(--border)] bg-white/80 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-0 sm:px-5">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2 text-[13px] font-medium text-[var(--ink)] sm:gap-3">
              {index > 0 ? (
                <span
                  aria-hidden="true"
                  className="hidden text-[var(--muted)] sm:inline sm:px-3"
                >
                  →
                </span>
              ) : null}
              <span className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--lavender)] text-[10px] font-semibold text-[var(--violet)]">
                  {index + 1}
                </span>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
