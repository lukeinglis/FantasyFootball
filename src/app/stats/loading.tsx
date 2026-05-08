import PageHeader from "@/components/PageHeader";
import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function StatsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="League Stats"
        subtitle="The numbers behind the madness. Superlatives, rankings, and bragging rights."
      />
      <Container>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="h-10 animate-pulse rounded-md bg-white/10"
                    />
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
