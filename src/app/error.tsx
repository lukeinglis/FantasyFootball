"use client";

import { useEffect } from "react";
import Link from "next/link";
import Container from "@/components/Container";

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
    <Container className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f0c75e]">
        Something broke
      </p>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white">
        We fumbled this page.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-300">
        An unexpected error tripped us up. Try again — if it keeps happening,
        ping the commissioner.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-gray-500">
          ref: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-[#f0c75e] px-4 py-2 text-sm font-semibold text-[#0f1f3a] hover:bg-yellow-300"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-[#f0c75e]/40 px-4 py-2 text-sm font-semibold text-[#f0c75e] hover:bg-[#f0c75e]/10"
        >
          Back to Home
        </Link>
      </div>
    </Container>
  );
}
