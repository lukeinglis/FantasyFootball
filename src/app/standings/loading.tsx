import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import { SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      {/* No pennant here. The skeleton used to label itself "2025 season"
          before the fetch had returned, which is a claim about content we do
          not have yet, and it was wrong about the year besides. */}
      <PageHeader
        eyebrow="Loading"
        title="Standings"
        subtitle="Top 6 qualify for playoffs. Everyone else gets to think about their life choices."
      />
      <Container>
        <Card>
          <CardBody>
            <SkeletonRows rows={12} />
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
