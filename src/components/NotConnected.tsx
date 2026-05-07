import EmptyState from "./EmptyState";

interface NotConnectedProps {
  /** What was being fetched when the connection failed (e.g. "standings"). */
  resource: string;
  /** The underlying error message, if helpful for the user. */
  detail?: string;
}

export default function NotConnected({ resource, detail }: NotConnectedProps) {
  return (
    <EmptyState
      icon={<span>📡</span>}
      title="Yahoo API not connected"
      description={
        `Live ${resource} are unavailable until the league commissioner connects ` +
        `the Yahoo Fantasy Sports API. Once authorized, this page will populate ` +
        `automatically.${detail ? ` (${detail})` : ""}`
      }
    />
  );
}

export function ApiError({
  resource,
  detail,
}: {
  resource: string;
  detail?: string;
}) {
  return (
    <EmptyState
      icon={<span>⚠️</span>}
      title={`Couldn't load ${resource}`}
      description={
        `We hit a snag fetching the latest ${resource} from Yahoo. ` +
        `This is usually temporary — try refreshing in a minute.` +
        (detail ? ` (${detail})` : "")
      }
    />
  );
}
