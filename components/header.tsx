"use client";

import { Button } from "@/components/ui/button";

type HeaderProps = {
  onOpenAbout: () => void;
};

export function Header({ onOpenAbout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color:rgb(248_247_251_/_0.86)] backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 text-[var(--ink)]">
          <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-[var(--violet)] text-white">
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
              <rect x="2" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.55" />
              <rect x="6" y="5" width="8" height="8" rx="1.5" fill="currentColor" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">AgentGym</span>
        </a>

        <nav className="hidden items-center gap-1 text-sm text-[var(--muted)] sm:flex">
          <a className="rounded-full px-3 py-1.5 hover:bg-[var(--lavender)] hover:text-[var(--ink)]" href="#lab">
            The Lab
          </a>
          <button
            type="button"
            className="rounded-full px-3 py-1.5 hover:bg-[var(--lavender)] hover:text-[var(--ink)]"
            onClick={onOpenAbout}
          >
            Methodology
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[12px] font-medium text-[var(--muted)] sm:inline">
            Refund desk
          </span>
          <Button variant="ghost" size="sm" className="sm:hidden" onClick={onOpenAbout}>
            About
          </Button>
        </div>
      </div>
    </header>
  );
}
