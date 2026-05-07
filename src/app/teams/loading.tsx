import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="The League"
        title="Teams"
        subtitle="Every franchise, every record, every manager who refuses to set their lineup."
      />
      <Container>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <li
              key={i}
              className="rounded-xl border border-white/10 bg-[#14284a] p-5"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
