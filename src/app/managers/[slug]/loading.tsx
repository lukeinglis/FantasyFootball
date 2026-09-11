import Container from "@/components/Container";

/**
 * Mirrors the real manager page: a section front on the paper surface, then a
 * strip of stat cells. The old version painted a teal-to-green gradient banner,
 * which no longer exists anywhere else on the site.
 */
export default function ManagerLoading() {
  return (
    <>
      <div className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8">
          <div className="h-3 w-28 animate-pulse bg-rule" />
          <div className="mt-3 h-10 w-64 animate-pulse bg-rule" />
          <div className="mt-3 h-4 w-48 animate-pulse bg-rule" />
        </div>
      </div>
      <Container>
        <div className="grid grid-cols-2 border-s border-t border-rule sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-b border-e border-rule bg-surface px-4 py-5">
              <div className="h-2.5 w-16 animate-pulse bg-rule" />
              <div className="mt-3 h-7 w-14 animate-pulse bg-rule" />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
