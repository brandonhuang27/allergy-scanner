"use client";

import { useState } from "react";
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
  const isMenu = result.kind === "menu";
  const flagged = new Set(result.findings.map((f) => f.allergen));
  const notFound = [...profile.allergens, ...profile.custom].filter((a) => !flagged.has(a));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Results</h2>
        {result.readable && result.detectedLanguage && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {isMenu ? "Menu" : "Label"} language: {result.detectedLanguage}
          </p>
        )}
      </div>

      {isMenu && result.readable && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-100">
          Menus don&apos;t list every ingredient. Always tell your server about your allergy before
          ordering, even for dishes that aren&apos;t flagged.
        </p>
      )}

      {result.message && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          {result.message}
        </p>
      )}

      {!result.readable ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          ⚪ We couldn&apos;t read this {isMenu ? "menu" : "label"} well enough to check it. Try a
          closer, sharper photo with the {isMenu ? "dishes" : "whole ingredient list"} in frame and
          no glare.
        </p>
      ) : (
        <>
          {isMenu ? (
            <MenuDishes findings={result.findings} />
          ) : (
            GROUPS.map((g) => {
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
            })
          )}

          {notFound.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
              <p className="font-medium">
                {isMenu ? "No dishes flagged for" : "Not found in the text"}
              </p>
              <p className="mt-1">{notFound.map(labelFor).join(", ")}</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {isMenu
                  ? "Dishes can still contain these without the menu saying so. Ask your server."
                  : "This only means we didn't see them on the label. It does not mean the food is safe."}
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
                Compare this with the {isMenu ? "menu" : "label"}. If anything was misread, retake the
                photo.
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

const VERDICT_ORDER: Verdict[] = ["contains", "possible", "unknown"];
const COLLAPSED_DISHES = 8;

/** Groups a dish's findings that share a reason (e.g. wheat and gluten for pastry), worst first. */
function mergeByReason(items: Finding[]) {
  const byReason = new Map<string, Finding[]>();
  for (const f of VERDICT_ORDER.flatMap((v) => items.filter((x) => x.verdict === v))) {
    byReason.set(f.reason, [...(byReason.get(f.reason) ?? []), f]);
  }
  return [...byReason.entries()].map(([reason, flags]) => ({ reason, flags }));
}

/** Menu results: one card per dish, worst first, with each flagged allergen inside. */
function MenuDishes({ findings }: { findings: Finding[] }) {
  const [showAll, setShowAll] = useState(false);

  const byDish = new Map<string, Finding[]>();
  for (const f of findings) {
    const dish = f.dish || "Other";
    byDish.set(dish, [...(byDish.get(dish) ?? []), f]);
  }
  const worst = (items: Finding[]) =>
    Math.min(...items.map((f) => VERDICT_ORDER.indexOf(f.verdict)));
  // Stable sort: dishes keep menu order within each severity.
  const dishes = [...byDish.entries()].sort((a, b) => worst(a[1]) - worst(b[1]));
  const shown = showAll ? dishes : dishes.slice(0, COLLAPSED_DISHES);

  if (dishes.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold">
        Dishes to ask about{" "}
        <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">
          ({dishes.length})
        </span>
      </h3>
      <ul className="flex flex-col gap-2">
        {shown.map(([dish, items]) => {
          const group = GROUPS[worst(items)];
          return (
            <li key={dish} className={`rounded-xl border p-3 ${group.box}`}>
              <p className="font-semibold">{dish}</p>
              <ul className="mt-2 flex flex-col gap-2">
                {mergeByReason(items).map(({ reason, flags }) => (
                  <li key={reason} className="text-sm">
                    {flags.map((f) => {
                      const g = GROUPS[VERDICT_ORDER.indexOf(f.verdict)];
                      return (
                        <span
                          key={f.allergen}
                          className={`mr-1.5 mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${g.badge}`}
                        >
                          {labelFor(f.allergen)} · {g.title.toLowerCase()}
                        </span>
                      );
                    })}
                    {reason}
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
      {dishes.length > COLLAPSED_DISHES && (
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="rounded-xl border border-neutral-200 py-2.5 text-sm font-medium dark:border-neutral-800"
        >
          {showAll ? "Show fewer" : `Show all ${dishes.length} dishes`}
        </button>
      )}
    </div>
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
