import { CHALLENGE_SCHEDULE } from "../ballot-data";

export default function ChallengeTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#8B5E3C]/30">
            <th className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-wider text-[#D4A847]">
              Week
            </th>
            <th className="px-3 py-2 font-[family-name:var(--font-heading)] text-xs uppercase tracking-wider text-[#D4A847]">
              Challenge
            </th>
          </tr>
        </thead>
        <tbody>
          {CHALLENGE_SCHEDULE.map(({ week, challenge }) => (
            <tr
              key={week}
              className="border-b border-[#8B5E3C]/15 last:border-0"
            >
              <td className="px-3 py-2 font-semibold text-[#D4A847]">
                {week}
              </td>
              <td className="px-3 py-2 text-[#F5F0E8]">{challenge}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
