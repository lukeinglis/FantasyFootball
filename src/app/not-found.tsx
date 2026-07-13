import Link from "next/link";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function NotFound() {
  return (
    <Container className="flex items-center justify-center py-16">
      <Card variant="chalkboard" className="max-w-lg w-full">
        <CardBody variant="chalkboard">
          <div className="text-center">
            <p className="text-5xl" aria-hidden>🚩</p>
            <h1
              className="mt-4 text-3xl sm:text-4xl font-bold text-[#F5F0E8] text-shadow-glow-chalk"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Flag on the Play!
            </h1>
            <p className="mt-2 text-lg text-[rgba(245,240,232,0.85)]">
              Page not found.
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-[rgba(245,240,232,0.6)]">
              We couldn&apos;t find what you were looking for. Maybe it got
              dropped for a bye-week streamer.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="rounded-md bg-[#DD550C] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 shadow-[0_2px_8px_rgba(221,85,12,0.4)]"
              >
                Back to Home
              </Link>
              <Link
                href="/standings"
                className="rounded-md border border-[#8B5E3C] px-4 py-2 text-sm font-semibold text-[#F5F0E8]/70 hover:bg-white/5"
              >
                View Standings
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
