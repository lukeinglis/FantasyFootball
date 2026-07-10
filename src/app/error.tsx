"use client";

import { useEffect } from "react";
import Link from "next/link";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <Container className="flex items-center justify-center py-16">
      <Card variant="chalkboard" className="max-w-lg w-full">
        <CardBody variant="chalkboard">
          <div className="text-center">
            <p className="text-5xl" aria-hidden>🏈</p>
            <h1
              className="mt-4 text-3xl sm:text-4xl font-bold text-[#F5F0E8]"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 0 4px rgba(245,240,232,0.2)" }}
            >
              Fumble!
            </h1>
            <p className="mt-2 text-lg text-[rgba(245,240,232,0.85)]">
              Something went wrong.
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm text-[rgba(245,240,232,0.6)]">
              An unexpected error tripped us up. Try again — if it keeps
              happening, ping the commissioner.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-[11px] text-[#F5F0E8]/30">
                ref: {error.digest}
              </p>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-md bg-[#DD550C] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-500 shadow-[0_2px_8px_rgba(221,85,12,0.4)]"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded-md border border-[#8B5E3C] px-4 py-2 text-sm font-semibold text-[#F5F0E8]/70 hover:bg-white/5"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
