"use client";

import { useEffect, useState } from "react";
import { AboutPanel } from "@/components/about-panel";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { PipelineStrip } from "@/components/pipeline-strip";
import { Workspace } from "@/components/workspace";

export function AppShell() {
  const [about, setAbout] = useState(false);

  useEffect(() => {
    if (!about) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAbout(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [about]);

  return (
    <>
      <Header onOpenAbout={() => setAbout(true)} />
      <main>
        <Hero onOpenAbout={() => setAbout(true)} />
        <PipelineStrip />
        <Workspace />
      </main>
      <Footer />
      <AboutPanel open={about} onClose={() => setAbout(false)} />
    </>
  );
}
