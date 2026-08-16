"use server";

import { kv } from "@vercel/kv";
import pino from "pino";
import { ballotSchema } from "./ballot-schema";
import type { BallotData } from "./ballot-schema";
import members from "@/data/members.json";

const logger = pino({ name: "league-poll" });

export interface BallotResult {
  success: boolean;
  wasUpdate: boolean;
  data: BallotData | null;
  errors: Record<string, string> | null;
  nameWarning: string | null;
}

function normalizeManagerName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function findMatchingManager(name: string): string | null {
  const normalized = normalizeManagerName(name);
  return (
    members.active.find(
      (m) => normalizeManagerName(m.name) === normalized
    )?.name ?? null
  );
}

function findClosestManager(name: string): string | null {
  const normalized = normalizeManagerName(name);
  for (const member of members.active) {
    const memberNorm = normalizeManagerName(member.name);
    if (
      memberNorm.startsWith(normalized) ||
      normalized.startsWith(memberNorm)
    ) {
      return member.name;
    }
  }
  return null;
}

export async function submitBallot(formData: FormData): Promise<BallotResult> {
  const raw = {
    managerName: formData.get("managerName") as string | null ?? "",
    buyInVote: formData.get("buyInVote") as string | null ?? "",
    draftDates: formData.getAll("draftDates") as string[],
    draftNotes: formData.get("draftNotes") as string | null ?? "",
    keeperVote: formData.get("keeperVote") as string | null ?? "",
    challengeVote: formData.get("challengeVote") as string | null ?? "",
    travisHunterVote: formData.get("travisHunterVote") as string | null ?? "",
    writeIn: formData.get("writeIn") as string | null ?? "",
  };

  const result = ballotSchema.safeParse(raw);

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !errors[key]) {
        errors[key] = issue.message;
      }
    }
    return { success: false, wasUpdate: false, data: null, errors, nameWarning: null };
  }

  const data = result.data;
  const matchedName = findMatchingManager(data.managerName);
  let nameWarning: string | null = null;

  if (!matchedName) {
    const closestMatch = findClosestManager(data.managerName);
    if (closestMatch) {
      nameWarning = `Did you mean ${closestMatch}?`;
    }
  }

  const kvKey = `poll:2026:${normalizeManagerName(matchedName ?? data.managerName)}`;
  const existingEntry = await kv.get(kvKey);
  const wasUpdate = existingEntry !== null;

  const submission = {
    ...data,
    managerName: matchedName ?? data.managerName,
    submittedAt: new Date().toISOString(),
  };

  await kv.set(kvKey, JSON.stringify(submission));

  logger.info(
    { manager: submission.managerName, wasUpdate, kvKey },
    wasUpdate ? "ballot.resubmitted" : "ballot.submitted"
  );

  return {
    success: true,
    wasUpdate,
    data: { ...data, managerName: matchedName ?? data.managerName },
    errors: null,
    nameWarning,
  };
}
