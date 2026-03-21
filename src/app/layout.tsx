import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greybushes and Chili Dogs",
  description:
    "A bunch of degenerates who claim to be extraordinary swindlers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#1a3155] text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
