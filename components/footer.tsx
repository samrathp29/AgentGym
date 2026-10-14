export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-1 text-[12px] text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-[var(--ink)]">AgentGym · eval lab</p>
        <p>Same fixtures. Two prompts. Score what the agent tried to do.</p>
      </div>
    </footer>
  );
}
