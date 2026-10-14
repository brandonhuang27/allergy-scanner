"use client";

import { ALLERGENS } from "@/data/allergens";
import { Feedback } from "./Feedback";
import type { AllergyProfile, Finding, ScanResult, Verdict } from "@/lib/types";

const LABELS = new Map<string, string>(ALLERGENS.map((a) => [a.id, a.label]));
const labelFor = (allergen: string) => LABELS.get(allergen) ?? allergen;

const GROUPS: { verdict: Verdict; title: string; icon: string; box: string; badge: string }[] = [
  {
    verdict: "contains",
    title: "Contains",
    icon: "🔴",
    box: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50",
    badge: "bg-red-600 text-white",
  },
  {
    verdict: "possible",
    title: "Possible",
    icon: "🟡",
    box: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    badge: "bg-amber-500 text-black",
  },
  {
    verdict: "unknown",
    title: "Couldn't tell",
    icon: "⚪",
    box: "border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900",
    badge: "bg-neutral-500 text-white",
  },
];

interface Props {
  result: ScanResult;
  profile: AllergyProfile;
  /** The photo that was scanned, sent with feedback only if the person opts in. */
  photo: string;
  onScanAnother: () => void;
}

export function Results({ result, profile, photo, onScanAnother }: Props) {
  const flagged = new Set(result.findings.map((f) => f.allergen));
  const notFound = [...profile.allergens, ...profile.custom].filter((a) => !flagged.has(a));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Results</h2>
        {result.readable && result.detectedLanguage && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Label language: {result.detectedLanguage}
          </p>
        )}
      </div>

      {result.message && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          {result.message}
        </p>
      )}

      {!result.readable ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          ⚪ We couldn&apos;t read this label well enough to check it. Try a closer, sharper photo
          with the whole ingredient list in frame and no glare.
        </p>
      ) : (
        <>
          {GROUPS.map((g) => {
            const items = result.findings.filter((f) => f.verdict === g.verdict);
            if (items.length === 0) return null;
            return (
              <div key={g.verdict} className={`rounded-xl border p-3 ${g.box}`}>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <span aria-hidden>{g.icon}</span> {g.title}
                  <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
                    ({items.length})
                  </span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {items.map((f, i) => (
                    <FindingCard key={i} finding={f} badge={g.badge} />
                  ))}
                </ul>
              </div>
            );
          })}

          {notFound.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">Not found in the text</p>
              <p className="mt-1">{notFound.map(labelFor).join(", ")}</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                This only means we didn&apos;t see them on the label. It does not mean the food is
                safe.
              </p>
            </div>
          )}

          {result.ingredientsText && (
            <details className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <summary className="cursor-pointer font-medium">What we read from the photo</summary>
              <p className="mt-2 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                {result.ingredientsText}
              </p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                Compare this with the label. If anything was misread, retake the photo.
              </p>
            </details>
          )}
        </>
      )}

      <Feedback result={result} profile={profile} photo={photo} />

      <Disclaimer />

      <button
        type="button"
        onClick={onScanAnother}
        className="rounded-xl bg-emerald-600 py-3.5 font-semibold text-white"
      >
        Scan another label
      </button>
    </section>
  );
}

function FindingCard({ finding, badge }: { finding: Finding; badge: string }) {
  const translated = finding.translation && finding.translation !== finding.originalText;
  return (
    <li className="rounded-lg bg-white p-3 dark:bg-neutral-950">
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
        {labelFor(finding.allergen)}
      </span>
      <p className="mt-2 font-medium">&ldquo;{finding.originalText}&rdquo;</p>
      {translated && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">= {finding.translation}</p>
      )}
      <p className="mt-1 text-sm">{finding.reason}</p>
    </li>
  );
}

export function Disclaimer() {
  return (
    <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
      This tool helps you spot possible allergens. It can make mistakes and never confirms that a
      food is safe. Labels can be incomplete, and cross-contact isn&apos;t always disclosed. When in
      doubt, don&apos;t eat it, and ask staff or the manufacturer.
    </p>
  );
}
