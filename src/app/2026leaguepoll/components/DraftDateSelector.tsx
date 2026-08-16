import { DRAFT_DATE_OPTIONS } from "../ballot-data";

interface DraftDateSelectorProps {
  selected: string[];
  onToggle: (date: string) => void;
  noneSelected: boolean;
  onNoneToggle: () => void;
}

export default function DraftDateSelector({
  selected,
  onToggle,
  noneSelected,
  onNoneToggle,
}: DraftDateSelectorProps) {
  return (
    <fieldset>
      <legend className="sr-only">Draft date availability</legend>
      <div className="space-y-3">
        {DRAFT_DATE_OPTIONS.map((date) => (
          <label
            key={date}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-[#8B5E3C]/30 bg-[#1A0F08]/50 px-4 py-3 transition-colors hover:border-[#D4A847]/50"
          >
            <input
              type="checkbox"
              name="draftDates"
              value={date}
              checked={selected.includes(date)}
              disabled={noneSelected}
              onChange={() => onToggle(date)}
              className="h-5 w-5 rounded border-[#8B5E3C] bg-[#1A0F08] text-[#D4A847] accent-[#D4A847]"
            />
            <span className="text-base text-[#F5F0E8]">{date}</span>
          </label>
        ))}
        <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-[#8B5E3C]/30 bg-[#1A0F08]/50 px-4 py-3 transition-colors hover:border-[#D4A847]/50">
          <input
            type="checkbox"
            checked={noneSelected}
            onChange={onNoneToggle}
            className="h-5 w-5 rounded border-[#8B5E3C] bg-[#1A0F08] text-[#D4A847] accent-[#D4A847]"
          />
          <span className="text-base text-[#F5F0E8]">
            None of these work for me
          </span>
        </label>
      </div>
    </fieldset>
  );
}
