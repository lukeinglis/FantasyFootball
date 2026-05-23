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

  it("handles two items with same value", () => {
    const ranks = denseRanks([{ v: 5 }, { v: 5 }], (i) => i.v);
    expect(ranks).toEqual([1, 1]);
  });

  it("handles large number of sequential unique values", () => {
    const items = Array.from({ length: 100 }, (_, i) => ({ v: 100 - i }));
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });

  it("handles alternating tie groups", () => {
    const items = [{ v: "a" }, { v: "b" }, { v: "b" }, { v: "c" }, { v: "c" }, { v: "c" }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 2, 2, 3, 3, 3]);
  });

  it("handles negative numeric values", () => {
    const items = [{ v: -1 }, { v: -1 }, { v: -5 }, { v: -10 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 1, 2, 3]);
  });

  it("handles zero values", () => {
    const items = [{ v: 0 }, { v: 0 }, { v: 0 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 1, 1]);
  });

  it("handles mixed positive and negative values", () => {
    const items = [{ v: 10 }, { v: 0 }, { v: -5 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 2, 3]);
  });

  it("handles decimal values with ties", () => {
    const items = [{ v: 1.5 }, { v: 1.5 }, { v: 1.0 }];
    const ranks = denseRanks(items, (i) => i.v);
    expect(ranks).toEqual([1, 1, 2]);
  });
});
