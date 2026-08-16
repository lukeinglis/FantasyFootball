import { z } from "zod/v4";

export const ballotSchema = z.object({
  managerName: z
    .string()
    .min(1, "Please enter your name")
    .max(50, "Name is too long"),
  buyInVote: z.enum(["keep", "change"], {
    error: "Please vote on the buy-in",
  }),
  draftDates: z.array(z.string()).default([]),
  draftNotes: z.string().max(500).default(""),
  keeperVote: z.enum(["keep", "change"], {
    error: "Please vote on keeper rules",
  }),
  challengeVote: z.enum(["keep", "change"], {
    error: "Please vote on weekly challenges",
  }),
  travisHunterVote: z.enum(["yes", "no"], {
    error: "Please vote on the Travis Hunter Rule",
  }),
  writeIn: z.string().max(2000).default(""),
});

export type BallotData = z.infer<typeof ballotSchema>;
