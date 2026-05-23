import { describe, it, expect } from "vitest";
import { denseRanks } from "./records";

describe("denseRanks", () => {
  it("assigns sequential ranks with no ties", () => {
    const items = [{ v: 10 }, { v: 8 }, { v: 5 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 2, 3]);
  });

  it("assigns same rank for tied values", () => {
    const items = [{ v: 10 }, { v: 10 }, { v: 5 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 1, 2]);
  });

  it("handles all identical values", () => {
    const items = [{ v: 7 }, { v: 7 }, { v: 7 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 1, 1]);
  });

  it("handles multiple tie groups", () => {
    const items = [{ v: 10 }, { v: 10 }, { v: 8 }, { v: 8 }, { v: 3 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 1, 2, 2, 3]);
  });

  it("returns empty array for empty input", () => {
    const ranks = denseRanks([], (i: { v: number }) => i.v);
    expect(ranks).toEqual([]);
  });

  it("handles single item", () => {
    const ranks = denseRanks([{ v: 42 }], (i) => i.v);
    expect(ranks).toEqual([1]);
  });

  it("works with string values", () => {
    const items = ["alpha", "alpha", "beta", "gamma"];
    const ranks = denseRanks(items, (s) => s);
    expect(ranks).toEqual([1, 1, 2, 3]);
  });

  it("handles tie at the end", () => {
    const items = [{ v: 10 }, { v: 5 }, { v: 5 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 2, 2]);
  });
});
