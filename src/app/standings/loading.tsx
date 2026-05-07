import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import { SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <>
      <PageHeader
        eyebrow="Live"
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
