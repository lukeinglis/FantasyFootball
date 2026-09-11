import Link from "next/link";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function NotFound() {
  return (
    <Container className="flex items-center justify-center py-16">
      <Card variant="chalkboard" className="max-w-lg w-full">
        <CardBody variant="chalkboard">
          <div className="text-center">
            <h1
              className="mt-4 text-3xl sm:text-4xl font-bold text-ink"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Flag on the Play!
            </h1>
            <p className="mt-2 text-lg text-ink-muted">
              Page not found.
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-ink-faint">
              We couldn&apos;t find what you were looking for. Maybe it got
              dropped for a bye-week streamer.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/"
                className="bg-result px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink"
              >
                Back to Home
              </Link>
              <Link
                href="/standings"
                className="border border-[#DCE1E9] px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-paper"
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
