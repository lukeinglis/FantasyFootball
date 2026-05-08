import type { Metadata } from "next";
import { Oswald, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "600", "700"],
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
        className={`${oswald.variable} ${sourceSans.variable} font-[family-name:var(--font-body)] bg-[#0C2340] text-white min-h-screen flex flex-col antialiased`}
      >
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
