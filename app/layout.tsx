import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  display: "swap",
  weight: "300 900",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentGym · adversarial eval lab for support agents",
  description:
    "Same refund cases. Two prompts. Score the agent on what it tried to do, not how it sounded.",
  openGraph: {
    title: "AgentGym · adversarial eval lab for support agents",
    description:
      "Same refund cases. Two prompts. Score the agent on what it tried to do, not how it sounded.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AgentGym · adversarial eval lab for support agents",
    description:
      "Same refund cases. Two prompts. Score the agent on what it tried to do, not how it sounded.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--ink)]">
        {children}
      </body>
    </html>
  );
}
