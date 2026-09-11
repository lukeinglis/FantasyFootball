import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MobileNav from "@/components/MobileNav";

/**
 * Three faces, three jobs. Condensed grotesque for headlines so long manager
 * names and team names fit without shrinking; a serif for body copy because
 * this site is mostly read, not skimmed; monospace for anything that is a
 * number, a label or a record, so columns align.
 *
 * `--font-*` aliases are kept alongside the `--wire-*` names because pages
 * across the site still reference the old variables.
 */
const display = Saira_Condensed({
  subsets: ["latin"],
  variable: "--wire-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--wire-body",
  display: "swap",
  weight: ["400", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--wire-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Greybushes & Chili Dogs",
    template: "%s | Greybushes & Chili Dogs",
  },
  description:
    "A bunch of degenerates who claim to be extraordinary swindlers. Fantasy football league running 10+ years strong.",
  metadataBase: new URL("https://football.lukeinglis.me"),
  openGraph: {
    title: "Greybushes & Chili Dogs",
    description:
      "A bunch of degenerates who claim to be extraordinary swindlers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${display.variable} ${body.variable} ${mono.variable} font-[family-name:var(--wire-body)] bg-paper text-ink min-h-screen flex flex-col antialiased`}
      >
        <SiteNav />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooter />
        <MobileNav />
      </body>
    </html>
  );
}
