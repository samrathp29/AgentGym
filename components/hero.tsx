"use client";

import { HeroPreview } from "@/components/hero-preview";
import { Button } from "@/components/ui/button";

type HeroProps = {
  onOpenAbout: () => void;
};

export function Hero({ onOpenAbout }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-2 sm:px-6 sm:pt-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(ellipse_at_top,#ece8ff_0%,transparent_58%)]"
      />
      <div className="relative mx-auto max-w-[1440px]">
        <p className="text-[13px] font-medium text-[var(--violet)]">AgentGym</p>
        <h1 className="mt-3 max-w-3xl text-[2.15rem] leading-[1.08] font-semibold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-[56px]">
          Good agents pass tests.
          <span className="block">Great agents survive customers.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[var(--muted)] sm:text-base">
          Same refund cases. Two prompts. Score the agent on what it tried to do, not how it
          sounded.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="#lab">
            <Button size="lg">Explore the lab</Button>
          </a>
          <Button variant="secondary" size="lg" onClick={onOpenAbout}>
            How it works
          </Button>
        </div>
        <HeroPreview />
      </div>
    </section>
  );
}
