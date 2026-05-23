import { describe, it, expect } from "vitest";
import { formatPoints, toFiniteNumber, isFiniteNumber, formatInt, formatRecord, formatPercent } from "./format";

describe("toFiniteNumber", () => {
  it("returns the value for normal numbers", () => {
    expect(toFiniteNumber(42)).toBe(42);
    expect(toFiniteNumber(0)).toBe(0);
    expect(toFiniteNumber(-3.14)).toBe(-3.14);
  });

  it("returns fallback for NaN", () => {
    expect(toFiniteNumber(NaN)).toBe(0);
    expect(toFiniteNumber(NaN, -1)).toBe(-1);
  });

  it("returns fallback for Infinity", () => {
    expect(toFiniteNumber(Infinity)).toBe(0);
    expect(toFiniteNumber(-Infinity)).toBe(0);
    expect(toFiniteNumber(Infinity, 99)).toBe(99);
  });

  it("returns fallback for null and undefined", () => {
    expect(toFiniteNumber(null)).toBe(0);
    expect(toFiniteNumber(undefined)).toBe(0);
  });

  it("parses numeric strings", () => {
    expect(toFiniteNumber("42")).toBe(42);
    expect(toFiniteNumber("3.14")).toBe(3.14);
    expect(toFiniteNumber("-10")).toBe(-10);
  });

  it("returns fallback for non-numeric strings", () => {
    expect(toFiniteNumber("abc")).toBe(0);
    expect(toFiniteNumber("")).toBe(0);
    expect(toFiniteNumber("  ")).toBe(0);
  });

  it("returns fallback for division by zero results", () => {
    expect(toFiniteNumber(1 / 0)).toBe(0);
    expect(toFiniteNumber(-1 / 0)).toBe(0);
  });

  it("returns fallback for booleans and objects", () => {
    expect(toFiniteNumber(true)).toBe(0);
    expect(toFiniteNumber({})).toBe(0);
    expect(toFiniteNumber([])).toBe(0);
  });
});

describe("formatPoints", () => {
  it("formats normal numbers with 2 decimal places by default", () => {
    expect(formatPoints(123.456)).toBe("123.46");
    expect(formatPoints(0)).toBe("0.00");
    expect(formatPoints(100)).toBe("100.00");
  });

  it("supports custom decimal digits", () => {
    expect(formatPoints(3.14159, 3)).toBe("3.142");
    expect(formatPoints(42, 0)).toBe("42");
  });

  it("returns dash for null and undefined", () => {
    expect(formatPoints(null)).toBe("—");
    expect(formatPoints(undefined)).toBe("—");
  });

  it("returns dash for NaN and Infinity", () => {
    expect(formatPoints(NaN)).toBe("—");
    expect(formatPoints(Infinity)).toBe("—");
    expect(formatPoints(-Infinity)).toBe("—");
  });

  it("handles negative numbers", () => {
    expect(formatPoints(-5.5)).toBe("-5.50");
  });
});

describe("isFiniteNumber", () => {
  it("returns true for finite numbers", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(42)).toBe(true);
    expect(isFiniteNumber(-3.14)).toBe(true);
  });

  it("returns false for non-finite numbers", () => {
    expect(isFiniteNumber(NaN)).toBe(false);
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
  });

  it("returns false for non-number types", () => {
    expect(isFiniteNumber("42")).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
  });
});

describe("formatInt", () => {
  it("truncates to integer", () => {
    expect(formatInt(3.9)).toBe("3");
    expect(formatInt(0)).toBe("0");
  });

  it("returns dash for invalid input", () => {
    expect(formatInt(null)).toBe("—");
    expect(formatInt(Infinity)).toBe("—");
  });
});

describe("formatRecord", () => {
  it("formats W-L without ties", () => {
    expect(formatRecord(10, 3, 0)).toBe("10-3");
    expect(formatRecord(10, 3, null)).toBe("10-3");
  });

  it("formats W-L-T with ties", () => {
    expect(formatRecord(7, 5, 2)).toBe("7-5-2");
  });

  it("handles null/undefined inputs", () => {
    expect(formatRecord(null, null, null)).toBe("0-0");
    expect(formatRecord(undefined, undefined, undefined)).toBe("0-0");
  });
});

describe("formatPercent", () => {
  it("formats 0-1 range as percentage", () => {
    expect(formatPercent(0.5)).toBe("50.0%");
    expect(formatPercent(1)).toBe("100.0%");
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("returns dash for invalid input", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatPercent(NaN)).toBe("—");
  });
});
