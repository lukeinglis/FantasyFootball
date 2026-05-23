import { describe, it, expect } from "vitest";
import { normalizeManagerName, getManagerSlug } from "./managers";

describe("normalizeManagerName", () => {
  it("maps known aliases to canonical names", () => {
    expect(normalizeManagerName("luke")).toBe("Luke");
    expect(normalizeManagerName("cody")).toBe("Cody");
    expect(normalizeManagerName("Kyle V")).toBe("Kyle");
    expect(normalizeManagerName("JohnH")).toBe("John");
  });

  it("returns the raw name if no mapping exists", () => {
    expect(normalizeManagerName("Bob")).toBe("Bob");
    expect(normalizeManagerName("Unknown Player")).toBe("Unknown Player");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeManagerName("")).toBe("");
  });

  it("is case-sensitive for mappings", () => {
    expect(normalizeManagerName("Luke")).toBe("Luke");
    expect(normalizeManagerName("LUKE")).toBe("LUKE");
  });
});

describe("getManagerSlug", () => {
  it("returns lowercase slug for canonical names", () => {
    expect(getManagerSlug("Luke")).toBe("luke");
    expect(getManagerSlug("Bob")).toBe("bob");
  });

  it("normalizes before slugifying", () => {
    expect(getManagerSlug("luke")).toBe("luke");
    expect(getManagerSlug("Kyle V")).toBe("kyle");
  });

  it("encodes special characters", () => {
    expect(getManagerSlug("O'Brien")).toBe("o'brien");
  });

  it("handles empty string", () => {
    expect(getManagerSlug("")).toBe("");
  });
});
