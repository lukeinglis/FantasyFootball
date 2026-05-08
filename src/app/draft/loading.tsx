import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function DraftLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Draft"
        title="Draft Board"
        subtitle="Loading picks..."
      />
      <Container>
        <Card>
          <CardBody>
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-md bg-white/10"
                />
              ))}
            </div>
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
