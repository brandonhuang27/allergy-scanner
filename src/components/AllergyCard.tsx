"use client";

import { CARD_LANGUAGES, type CardLanguage } from "@/data/allergyCard";
import { saveCardLanguage, useCardLanguage } from "@/lib/profileStore";
import type { AllergyProfile } from "@/lib/types";

interface Props {
  profile: AllergyProfile;
  onClose: () => void;
}

const ENGLISH = CARD_LANGUAGES[0];

/** A card in the local language that travelers show to restaurant staff. */
export function AllergyCard({ profile, onClose }: Props) {
  const saved = useCardLanguage();
  const language = CARD_LANGUAGES.find((l) => l.code === saved) ?? CARD_LANGUAGES[1];

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Allergy card</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Show this to restaurant staff.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-neutral-200 px-3 py-1.5 text-sm font-medium dark:border-neutral-800"
        >
          Done
        </button>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Language
        <select
          value={language.code}
          onChange={(e) => saveCardLanguage(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base dark:border-neutral-800 dark:bg-neutral-900"
        >
          {CARD_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.nativeName}
              {l.nativeName !== l.englishName ? ` (${l.englishName})` : ""}
            </option>
          ))}
        </select>
      </label>

      {/* Always dark text on white, so it's easy to read in any light or theme. */}
      <div lang={language.code} className="rounded-2xl border-2 border-red-600 bg-white p-5 text-neutral-950">
        <CardText language={language} profile={profile} large />
      </div>

      {profile.custom.length > 0 && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Allergies you added yourself ({profile.custom.join(", ")}) are shown in English.
        </p>
      )}

      {language.code !== ENGLISH.code && (
        <details className="rounded-xl border border-neutral-200 p-3 text-sm dark:border-neutral-800">
          <summary className="cursor-pointer font-medium">What it says in English</summary>
          <div className="mt-2">
            <CardText language={ENGLISH} profile={profile} />
          </div>
        </details>
      )}

      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
        Translations haven&apos;t been checked by native speakers yet. Staff may still not know
        every ingredient, so keep asking questions.
      </p>
    </section>
  );
}

function CardText({
  language,
  profile,
  large = false,
}: {
  language: CardLanguage;
  profile: AllergyProfile;
  large?: boolean;
}) {
  const items = [...profile.allergens.map((id) => language.allergens[id]), ...profile.custom];
  return (
    <div className={`flex flex-col ${large ? "gap-3" : "gap-1.5"}`}>
      <p className={large ? "text-2xl font-bold text-red-700" : "font-semibold"}>{language.title}</p>
      <p className={large ? "text-lg" : ""}>{language.intro}</p>
      <ul className={`list-disc pl-6 ${large ? "text-xl font-semibold" : ""}`}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className={large ? "text-base" : ""}>{language.warning}</p>
      <p className={large ? "text-lg font-semibold" : ""}>{language.closing}</p>
    </div>
  );
}
