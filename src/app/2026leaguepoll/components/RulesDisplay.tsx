import { KEEPER_RULES } from "../ballot-data";

export default function RulesDisplay() {
  return (
    <ul className="space-y-2 text-sm text-[#F5F0E8]">
      {KEEPER_RULES.map((rule) => (
        <li key={rule} className="flex gap-2">
          <span className="mt-1 text-[#D4A847]">&bull;</span>
          <span>{rule}</span>
        </li>
      ))}
    </ul>
  );
}
