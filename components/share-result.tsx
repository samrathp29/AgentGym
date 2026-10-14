"use client";

import { useState } from "react";
import { RunCard } from "@/components/run-card";
import { Button } from "@/components/ui/button";
import { buildSharePath, snapshotFromRun } from "@/lib/share";
import type { EvalRun } from "@/lib/types";

type ShareResultProps = {
  run: EvalRun;
  onClose: () => void;
};

export function ShareResult({ run, onClose }: ShareResultProps) {
  const snapshot = snapshotFromRun(run);
  const path = buildSharePath(snapshot);
  const [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState(false);

  async function copyLink() {
    const absolute = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  function openResult() {
    window.open(path, "_blank", "noopener,noreferrer");
    setOpened(true);
    window.setTimeout(() => setOpened(false), 1600);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[var(--ink)]/40 p-3 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[22px] bg-[var(--background)] shadow-[0_24px_80px_rgba(25,23,37,0.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-[var(--border)] bg-white px-5 py-4">
          <h2 id="share-title" className="text-lg font-semibold text-[var(--ink)]">
            Share result
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Open a clean result card, or copy a link with Open Graph preview.
          </p>
        </div>
        <div className="p-4 sm:p-5">
          <RunCard snapshot={snapshot} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={openResult}>{opened ? "Opened" : "Open result"}</Button>
            <Button variant="secondary" onClick={copyLink}>
              {copied ? "Link copied" : "Copy link"}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
