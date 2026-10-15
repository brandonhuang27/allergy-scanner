"use client";

import { useState } from "react";
import { AccessGate } from "@/components/AccessGate";
import { AllergyCard } from "@/components/AllergyCard";
import { AllergyPicker } from "@/components/AllergyPicker";
import { PhotoInput } from "@/components/PhotoInput";
import { Disclaimer, Results } from "@/components/Results";
import { ALLERGENS } from "@/data/allergens";
import { AccessCodeError, analyzeLabel } from "@/lib/analyze";
import { saveAccessCode, saveProfile, useAccessCode, useProfile } from "@/lib/profileStore";
import type { AllergyProfile, ScanResult } from "@/lib/types";

export default function Home() {
  const profile = useProfile();
  const accessCode = useAccessCode();
  const [editing, setEditing] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ scan: ScanResult; photo: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);

  async function analyze(image: string, p: AllergyProfile) {
    setBusy(true);
    setError(null);
    try {
      setResult({ scan: await analyzeLabel(image, p), photo: image });
    } catch (e) {
      if (e instanceof AccessCodeError) {
        setCodeNotice("Your access code has changed. Please enter the new one.");
        saveAccessCode(null);
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  let body: React.ReactNode;
  if (profile === undefined || accessCode === undefined) {
    body = null; // Loading saved data.
  } else if (accessCode === null) {
    body = (
      <AccessGate
        notice={codeNotice}
        onAccepted={(code) => {
          saveAccessCode(code);
          setCodeNotice(null);
        }}
      />
    );
  } else if (profile === null || editing) {
    body = (
      <AllergyPicker
        initial={profile}
        onSave={(p) => {
          saveProfile(p);
          setEditing(false);
        }}
      />
    );
  } else if (showCard) {
    body = <AllergyCard profile={profile} onClose={() => setShowCard(false)} />;
  } else if (result) {
    body = (
      <Results
        result={result.scan}
        profile={profile}
        photo={result.photo}
        onScanAnother={() => setResult(null)}
      />
    );
  } else {
    body = (
      <>
        <ProfileSummary
          profile={profile}
          onEdit={() => setEditing(true)}
          onShowCard={() => setShowCard(true)}
        />
        <PhotoInput busy={busy} onAnalyze={(image) => analyze(image, profile)} />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Disclaimer />
      </>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 pt-6 pb-10">
      <header className="flex items-center gap-2">
        <span aria-hidden className="text-2xl">🌿</span>
        <h1 className="text-lg font-bold tracking-tight">Allergy Scanner</h1>
      </header>
      {body}
    </main>
  );
}

function ProfileSummary({
  profile,
  onEdit,
  onShowCard,
}: {
  profile: AllergyProfile;
  onEdit: () => void;
  onShowCard: () => void;
}) {
  const names = [
    ...profile.allergens.map((id) => ALLERGENS.find((a) => a.id === id)?.label ?? id),
    ...profile.custom,
  ];
  return (
    <div className="rounded-xl bg-neutral-100 p-3 dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
          Your allergies
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
        >
          Edit
        </button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {names.map((n) => (
          <li
            key={n}
            className="rounded-full bg-white px-2.5 py-0.5 text-sm dark:bg-neutral-800"
          >
            {n}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onShowCard}
        className="mt-3 w-full rounded-lg border border-red-600 bg-white py-2 text-sm font-semibold text-red-700 dark:bg-neutral-950 dark:text-red-400"
      >
        Show allergy card for staff
      </button>
    </div>
  );
}
