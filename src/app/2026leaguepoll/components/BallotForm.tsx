"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardBody } from "@/components/Card";
import { submitBallot, type BallotResult } from "../actions";
import type { BallotData } from "../ballot-schema";
import BallotConfirmation from "./BallotConfirmation";
import DraftDateSelector from "./DraftDateSelector";
import RulesDisplay from "./RulesDisplay";
import ChallengeTable from "./ChallengeTable";

const STORAGE_KEY = "poll_2026_ballot";
const SAVE_DELAY = 500;

interface FormState {
  managerName: string;
  buyInVote: string;
  draftDates: string[];
  draftNotes: string;
  keeperVote: string;
  challengeVote: string;
  travisHunterVote: string;
  writeIn: string;
  noneOfTheseDates: boolean;
}

const emptyState: FormState = {
  managerName: "",
  buyInVote: "",
  draftDates: [],
  draftNotes: "",
  keeperVote: "",
  challengeVote: "",
  travisHunterVote: "",
  writeIn: "",
  noneOfTheseDates: false,
};

function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
        {options.map((opt) => (
          <label
            key={opt.value}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-[#8B5E3C]/30 bg-[#1A0F08]/50 px-4 py-3 transition-colors hover:border-[#D4A847]/50"
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="h-5 w-5 border-[#8B5E3C] bg-[#1A0F08] text-[#D4A847] accent-[#D4A847]"
            />
            <span className="text-base text-[#F5F0E8]">{opt.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-[#FF6B35]" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export default function BallotForm() {
  const [form, setForm] = useState<FormState>(emptyState);
  const [restored, setRestored] = useState(false);
  const [submittedData, setSubmittedData] = useState<BallotData | null>(null);
  const [wasUpdate, setWasUpdate] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nameWarning, setNameWarning] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FormState>;
        setForm((prev) => ({ ...prev, ...parsed }));
        setRestored(true);
      }
    } catch {
      // ignore corrupt localStorage
    }
  }, []);

  const scheduleSave = useCallback((state: FormState) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // localStorage full or unavailable
      }
    }, SAVE_DELAY);
  }, []);

  function update(patch: Partial<FormState>) {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      scheduleSave(next);
      return next;
    });
  }

  function handleDraftToggle(date: string) {
    setForm((prev) => {
      const dates = prev.draftDates.includes(date)
        ? prev.draftDates.filter((d) => d !== date)
        : [...prev.draftDates, date];
      const next = { ...prev, draftDates: dates };
      scheduleSave(next);
      return next;
    });
  }

  function handleNoneToggle() {
    setForm((prev) => {
      const next = {
        ...prev,
        noneOfTheseDates: !prev.noneOfTheseDates,
        draftDates: !prev.noneOfTheseDates ? [] : prev.draftDates,
      };
      scheduleSave(next);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setNameWarning(null);

    const fd = new FormData();
    fd.set("managerName", form.managerName);
    fd.set("buyInVote", form.buyInVote);
    for (const date of form.draftDates) {
      fd.append("draftDates", date);
    }
    fd.set("draftNotes", form.draftNotes);
    fd.set("keeperVote", form.keeperVote);
    fd.set("challengeVote", form.challengeVote);
    fd.set("travisHunterVote", form.travisHunterVote);
    fd.set("writeIn", form.writeIn);

    try {
      const result = await submitBallot(fd);

      if (!result.success && result.errors) {
        setErrors(result.errors);
        setPending(false);
        return;
      }

      if (result.nameWarning) {
        setNameWarning(result.nameWarning);
      }

      if (result.success && result.data) {
        setSubmittedData(result.data);
        setWasUpdate(result.wasUpdate);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setPending(false);
    }
  }

  if (submittedData) {
    return <BallotConfirmation data={submittedData} wasUpdate={wasUpdate} />;
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6"
      noValidate
    >
      {restored && (
        <div className="rounded-lg border border-[#D4A847]/30 bg-[#1A0F08]/80 px-4 py-3 text-sm text-[#D4A847]">
          Resumed from saved draft
        </div>
      )}

      {errors.form && (
        <div
          className="rounded-lg border border-[#FF6B35]/30 bg-[#1A0F08]/80 px-4 py-3 text-sm text-[#FF6B35]"
          role="alert"
        >
          {errors.form}
        </div>
      )}

      {/* Section 1: Manager Name */}
      <Card variant="scoreboard">
        <CardHeader title="Manager Name" />
        <CardBody>
          <label className="block">
            <span className="mb-2 block text-sm text-[rgba(245,240,232,0.7)]">
              Enter your name to identify your ballot
            </span>
            <input
              type="text"
              name="managerName"
              value={form.managerName}
              onChange={(e) => update({ managerName: e.target.value })}
              placeholder="Your name"
              required
              autoComplete="name"
              className="w-full rounded-lg border border-[#8B5E3C]/50 bg-[#1A0F08]/80 px-4 py-3 text-base text-[#F5F0E8] placeholder-[rgba(245,240,232,0.3)] outline-none transition-colors focus:border-[#D4A847]"
            />
          </label>
          {errors.managerName && (
            <p className="mt-2 text-sm text-[#FF6B35]" role="alert">
              {errors.managerName}
            </p>
          )}
          {nameWarning && (
            <p className="mt-2 text-sm text-[#D4A847]">{nameWarning}</p>
          )}
        </CardBody>
      </Card>

      {/* Section 2: Buy-In */}
      <Card variant="scoreboard">
        <CardHeader
          title="Buy-In"
          description="2026 Buy-In: $250. Last season each team paid $250, creating a $3,000 total league pool."
        />
        <CardBody>
          <p className="mb-4 text-sm font-semibold text-[#F5F0E8]">
            Keep the $250 buy-in for 2026?
          </p>
          <RadioGroup
            name="buyInVote"
            label="Buy-in vote"
            options={[
              { value: "keep", label: "Yes, keep it at $250" },
              { value: "change", label: "No, call a league vote to change it" },
            ]}
            value={form.buyInVote}
            onChange={(v) => update({ buyInVote: v })}
            error={errors.buyInVote}
          />
        </CardBody>
      </Card>

      {/* Section 3: Draft Date */}
      <Card variant="scoreboard">
        <CardHeader title="2026 Draft Availability" />
        <CardBody>
          <p className="mb-4 text-sm text-[rgba(245,240,232,0.7)]">
            Select every date/time below that you are available. Please do not
            select only your preferred option. The goal is to find the time that
            works for the most managers.
          </p>
          <DraftDateSelector
            selected={form.draftDates}
            onToggle={handleDraftToggle}
            noneSelected={form.noneOfTheseDates}
            onNoneToggle={handleNoneToggle}
          />
          <label className="mt-4 block">
            <span className="mb-2 block text-sm text-[rgba(245,240,232,0.7)]">
              Availability notes (optional)
            </span>
            <textarea
              name="draftNotes"
              value={form.draftNotes}
              onChange={(e) => update({ draftNotes: e.target.value })}
              rows={2}
              maxLength={500}
              placeholder="Any scheduling notes..."
              className="w-full rounded-lg border border-[#8B5E3C]/50 bg-[#1A0F08]/80 px-4 py-3 text-base text-[#F5F0E8] placeholder-[rgba(245,240,232,0.3)] outline-none transition-colors focus:border-[#D4A847]"
            />
          </label>
        </CardBody>
      </Card>

      {/* Section 4: Keeper Rules */}
      <Card variant="scoreboard">
        <CardHeader
          title="Keeper Rules"
          description="Current keeper rules for ratification"
        />
        <CardBody>
          <div className="mb-4 rounded-lg border border-[#8B5E3C]/20 bg-[#1A0F08]/30 p-4">
            <RulesDisplay />
          </div>
          <p className="mb-4 text-sm font-semibold text-[#F5F0E8]">
            Keep the current keeper rules for 2026?
          </p>
          <RadioGroup
            name="keeperVote"
            label="Keeper rules vote"
            options={[
              { value: "keep", label: "Yes, keep them as-is" },
              {
                value: "change",
                label: "No, call a league vote to change the keeper rules",
              },
            ]}
            value={form.keeperVote}
            onChange={(v) => update({ keeperVote: v })}
            error={errors.keeperVote}
          />
        </CardBody>
      </Card>

      {/* Section 5: Weekly Challenges */}
      <Card variant="scoreboard">
        <CardHeader
          title="Weekly Challenges"
          description="$100 per week for Weeks 1-14, totaling $1,400"
        />
        <CardBody>
          <div className="mb-4 rounded-lg border border-[#8B5E3C]/20 bg-[#1A0F08]/30 p-3">
            <ChallengeTable />
          </div>
          <p className="mb-4 text-sm font-semibold text-[#F5F0E8]">
            Keep this weekly challenge lineup for 2026?
          </p>
          <RadioGroup
            name="challengeVote"
            label="Weekly challenges vote"
            options={[
              { value: "keep", label: "Yes, run it back" },
              {
                value: "change",
                label: "No, call a league vote to make changes",
              },
            ]}
            value={form.challengeVote}
            onChange={(v) => update({ challengeVote: v })}
            error={errors.challengeVote}
          />
        </CardBody>
      </Card>

      {/* Section 6: Travis Hunter Rule */}
      <Card variant="scoreboard">
        <CardHeader title="Travis Hunter Rule" />
        <CardBody>
          <p className="mb-4 text-sm text-[rgba(245,240,232,0.7)]">
            Historically, defensive tackles made by offensive players have not
            counted toward fantasy scoring. We should formally establish the rule
            for players who may contribute on both offense and defense.
          </p>
          <p className="mb-4 text-sm font-semibold text-[#F5F0E8]">
            Should tackles recorded by offensive players count toward their
            fantasy score?
          </p>
          <RadioGroup
            name="travisHunterVote"
            label="Travis Hunter Rule vote"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No, maintain the existing rule" },
            ]}
            value={form.travisHunterVote}
            onChange={(v) => update({ travisHunterVote: v })}
            error={errors.travisHunterVote}
          />
        </CardBody>
      </Card>

      {/* Section 7: Write-In */}
      <Card variant="scoreboard">
        <CardHeader title="Anything else we need to address?" />
        <CardBody>
          <p className="mb-4 text-sm text-[rgba(245,240,232,0.7)]">
            Is there a league rule, scoring setting, roster setting, weekly
            challenge, keeper rule, or anything else you want proposed for a
            league vote before the 2026 season?
          </p>
          <textarea
            name="writeIn"
            value={form.writeIn}
            onChange={(e) => update({ writeIn: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="Optional"
            className="w-full rounded-lg border border-[#8B5E3C]/50 bg-[#1A0F08]/80 px-4 py-3 text-base text-[#F5F0E8] placeholder-[rgba(245,240,232,0.3)] outline-none transition-colors focus:border-[#D4A847]"
          />
        </CardBody>
      </Card>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl border-2 border-[#D4A847] bg-[linear-gradient(180deg,#2C1810,#1A0F08)] px-6 py-4 font-[family-name:var(--font-heading)] text-lg uppercase tracking-widest text-[#D4A847] shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all hover:bg-[linear-gradient(180deg,#3C2820,#2A1F18)] hover:shadow-[0_0_16px_rgba(212,168,71,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Submitting..." : "Submit Ballot"}
      </button>
    </form>
  );
}
