import type { Metadata } from "next";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

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
      <body className="bg-[#0C2340] text-white min-h-screen flex flex-col antialiased">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
