"use client";

import { Button } from "@/components/ui/button";

type HeroProps = {
  onOpenAbout: () => void;
};

export function Hero({ onOpenAbout }: HeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pt-10 pb-6 sm:px-6 sm:pt-14 sm:pb-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,#d9d2ff_0%,#c7b8f5_38%,transparent_70%)] opacity-80 blur-3xl"
      />
      <div className="relative mx-auto max-w-[1440px]">
        <p className="text-[13px] font-medium text-[var(--violet)]">
          Adversarial agent evaluation
        </p>
        <h1 className="mt-3 max-w-3xl text-[2.15rem] leading-[1.08] font-semibold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-[56px]">
          Good agents pass tests.
          <span className="block">Great agents survive customers.</span>
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-6 text-[var(--muted)] sm:text-base">
          Stress-test a support agent with difficult customers. Trace failures. Validate fixes.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a href="#lab">
            <Button size="lg">Explore the lab</Button>
          </a>
          <Button variant="secondary" size="lg" onClick={onOpenAbout}>
            How it works
          </Button>
        </div>
      </div>
    </section>
  );
}
