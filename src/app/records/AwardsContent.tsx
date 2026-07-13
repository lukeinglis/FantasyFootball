import Container from "@/components/Container";
import { Card, CardBody } from "@/components/Card";
import {
  getChampions,
  getCoreAwards,
  computeSuperlatives,
} from "@/lib/awards";

export default function AwardsContent() {
  const champions = getChampions();
  const coreAwards = getCoreAwards();
  const superlatives = computeSuperlatives();

  return (
    <Container>
      <section aria-labelledby="champions-heading" className="mb-12">
        <h2
          id="champions-heading"
          className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-[#FFD700] mb-6"
        >
          <span aria-hidden className="mr-2">{"\u{1F3C6}"}</span>
          Championship Shelf
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {champions.map((c) => (
            <Card key={c.year} variant="chalkboard" className="text-center">
              <CardBody className="py-5">
                <p className="text-3xl" aria-hidden>{"\u{1F3C6}"}</p>
                <p className="mt-2 font-[family-name:var(--font-heading)] text-2xl font-bold text-[#FFD700]">
                  {c.year}
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {c.name}
                </p>
                <p className="mt-0.5 text-xs text-gray-400 leading-tight">
                  {c.team}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="core-awards-heading" className="mb-12">
        <h2
          id="core-awards-heading"
          className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-[#FFD700] mb-6"
        >
          <span aria-hidden className="mr-2">{"\u{1F3C5}"}</span>
          Core Awards
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreAwards.map((award) => (
            <Card key={award.name} variant="chalkboard">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0" aria-hidden>
                    {award.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide text-[#FFD700]">
                      {award.name}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {award.winner}
                    </p>
                    <p className="text-xs text-gray-400">{award.team}</p>
                    <p className="mt-2 text-sm font-medium text-[#DD550C]">
                      {award.stat}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {award.season} season
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="superlatives-heading">
        <h2
          id="superlatives-heading"
          className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-wide text-[#FFD700] mb-6"
        >
          <span aria-hidden className="mr-2">{"⭐"}</span>
          Superlatives
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {superlatives.map((s) => (
            <Card key={s.name} variant="chalkboard">
              <CardBody>
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0" aria-hidden>
                    {s.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-wide text-[#FFD700]">
                      {s.name}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {s.winner}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#DD550C]">
                      {s.stat}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {s.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </Container>
  );
}
