import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import OfflineRetryButton from "./OfflineRetryButton";

export default function OfflinePage() {
  return (
    <Container>
      <Card variant="chalkboard">
        <CardBody variant="chalkboard">
          <div className="text-center py-12">
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-ink">
              You&apos;re Offline
            </h1>
            <p className="mt-3 mx-auto max-w-md text-sm text-ink-soft">
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
