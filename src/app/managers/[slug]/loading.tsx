import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";

export default function ManagerLoading() {
  return (
    <>
      <div className="border-b border-[#D4A847]/20 bg-gradient-to-br from-[#2D8C3C] via-[#1E6B2B] to-[#1E6B2B]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-10 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-5 w-36 animate-pulse rounded bg-white/10" />
        </div>
      </div>
      <Container>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardBody>
                <div className="space-y-2">
                  <div className="h-3 w-16 mx-auto animate-pulse rounded bg-white/10" />
                  <div className="h-8 w-12 mx-auto animate-pulse rounded bg-white/10" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
