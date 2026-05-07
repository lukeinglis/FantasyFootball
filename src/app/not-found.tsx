import Link from "next/link";
import Container from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#f0c75e]">
        404
      </p>
      <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-white">
        That page is in the toilet bowl.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base text-gray-300">
        We couldn&apos;t find what you were looking for. Maybe it got dropped
        for a bye-week streamer.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-[#f0c75e] px-4 py-2 text-sm font-semibold text-[#0f1f3a] hover:bg-yellow-300"
        >
          Back to Home
        </Link>
        <Link
          href="/standings"
          className="rounded-md border border-[#f0c75e]/40 px-4 py-2 text-sm font-semibold text-[#f0c75e] hover:bg-[#f0c75e]/10"
        >
          View Standings
        </Link>
      </div>
    </Container>
  );
}
