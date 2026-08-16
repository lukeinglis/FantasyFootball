import { describe, it, expect, vi, beforeEach } from "vitest";
import { ballotSchema } from "../ballot-schema";

describe("ballotSchema", () => {
  const validBallot = {
    managerName: "Luke",
    buyInVote: "keep",
    draftDates: ["Saturday, August 23 at 3:00 PM CT"],
    draftNotes: "",
    keeperVote: "keep",
    challengeVote: "keep",
    travisHunterVote: "yes",
    writeIn: "",
  };

  it("accepts a valid ballot", () => {
    const result = ballotSchema.safeParse(validBallot);
    expect(result.success).toBe(true);
  });

  it("rejects empty manager name", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      managerName: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing buyInVote", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      buyInVote: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing keeperVote", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      keeperVote: "undecided",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing challengeVote", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      challengeVote: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid travisHunterVote", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      travisHunterVote: "maybe",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty draftDates", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      draftDates: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty writeIn", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      writeIn: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects writeIn over 2000 chars", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      writeIn: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects manager name over 50 chars", () => {
    const result = ballotSchema.safeParse({
      ...validBallot,
      managerName: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("defaults optional fields", () => {
    const result = ballotSchema.safeParse({
      managerName: "Luke",
      buyInVote: "keep",
      keeperVote: "keep",
      challengeVote: "change",
      travisHunterVote: "no",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.draftDates).toEqual([]);
      expect(result.data.draftNotes).toBe("");
      expect(result.data.writeIn).toBe("");
    }
  });
});
