import EmptyState from "./EmptyState";

interface OffseasonStateProps {
  /** The data type that would normally be shown (e.g. "standings", "matchups"). */
  resource: string;
}

/**
 * Friendly empty state for when the Yahoo API is connected and working
 * but the current NFL season hasn't started yet (offseason 400 errors).
 */
export default function OffseasonState({ resource }: OffseasonStateProps) {
  return (
    <EmptyState
      icon={<span>🏖️</span>}
      title="It's the offseason"
      description={
        `Live ${resource} data will be available once the new NFL season kicks off. ` +
        `The Yahoo API is connected and ready to go.`
      }
    />
  );
}
