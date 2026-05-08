import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function PowerRankingsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Rankings"
        title="Power Rankings"
        subtitle="Computing rankings..."
      />
      <Container>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                  </div>
                  <div className="h-10 w-14 animate-pulse rounded bg-white/10" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
