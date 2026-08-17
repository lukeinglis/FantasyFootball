import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import OfflineRetryButton from "./OfflineRetryButton";

export default function OfflinePage() {
  return (
    <Container>
      <Card variant="chalkboard">
        <CardBody variant="chalkboard">
          <div className="text-center py-12">
            <p className="text-5xl" aria-hidden>
              📡
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[#F5F0E8] text-shadow-md">
              You&apos;re Offline
            </h1>
            <p className="mt-3 mx-auto max-w-md text-sm text-[#F5F0E8]/70">
              Looks like you&apos;ve lost your connection. Check your network and
              try again. Previously viewed pages may still be available.
            </p>
            <OfflineRetryButton />
          </div>
        </CardBody>
      </Card>
    </Container>
  );
}
