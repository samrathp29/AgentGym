import type { Metadata } from "next";
import Link from "next/link";
import { RunCard } from "@/components/run-card";
import { Button } from "@/components/ui/button";
import { defaultShareCase, parseShareParams, shareCardCopy } from "@/lib/share";
import { getExampleRun } from "@/lib/example-runs";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function toParams(record: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    const item = first(value);
    if (item) params.set(key, item);
  }
  return params;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const raw = await searchParams;
  const snapshot =
    parseShareParams(toParams(raw)) ??
    parseShareParams(
      new URLSearchParams({
        case: defaultShareCase(),
        version: "v1",
        source: "example",
      }),
    );
  if (!snapshot) {
    return { title: "AgentGym result" };
  }
  const copy = shareCardCopy(snapshot);
  const ogQuery = new URLSearchParams({
    case: snapshot.caseId,
    version: snapshot.version,
    source: snapshot.source,
    status: snapshot.status,
    passed: String(snapshot.passedCount),
    total: String(snapshot.totalCount),
  });
  return {
    title: `${copy.title} · AgentGym`,
    description: copy.description,
    openGraph: {
      title: copy.title,
      description: copy.description,
      type: "website",
      images: [{ url: `/og?${ogQuery.toString()}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: [`/og?${ogQuery.toString()}`],
    },
  };
}

export default async function SharePage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const snapshot =
    parseShareParams(toParams(raw)) ??
    (() => {
      const example = getExampleRun(defaultShareCase(), "v1");
      return {
        caseId: example.caseId,
        version: example.version,
        source: example.source,
        status: example.status,
        durationMs: example.durationMs,
        passedCount: example.assertions.filter((a) => a.passed).length,
        totalCount: example.assertions.length,
        failedLabels: example.assertions.filter((a) => !a.passed).map((a) => a.label),
        evidence:
          example.assertions.find((a) => !a.passed)?.evidence.split("\n")[0] ?? "",
      };
    })();

  return (
    <main className="min-h-full px-4 py-10 sm:px-6">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="text-sm font-semibold text-[var(--ink)]">
            AgentGym
          </Link>
          <Link href="/#lab">
            <Button size="sm" variant="secondary">
              Open the lab
            </Button>
          </Link>
        </div>
        <RunCard snapshot={snapshot} />
        <p className="text-center text-[12px] text-[var(--muted)]">
          Closed-loop adversarial eval for Aster Audio refund agents.
        </p>
      </div>
    </main>
  );
}
