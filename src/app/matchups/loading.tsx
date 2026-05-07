import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import Skeleton from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Matchups"
        title="This Week's Matchups"
        subtitle="Live scores, projections, and head-to-head matchups straight from Yahoo."
      />
      <Container>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="mt-3 h-12 w-full" />
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
