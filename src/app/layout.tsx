import type { Metadata } from "next";
import { Luckiest_Guy, Bangers, Nunito } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

const bangers = Bangers({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: "400",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "600", "700", "800", "900"],
});

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
        className={`${luckiestGuy.variable} ${bangers.variable} ${nunito.variable} font-[family-name:var(--font-body)] bg-[#2D8C3C] text-white min-h-screen flex flex-col antialiased`}
      >
        <div className="yard-lines" aria-hidden />
        <SiteNav />
        <main className="flex-1 relative z-[1] grass-bg">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
