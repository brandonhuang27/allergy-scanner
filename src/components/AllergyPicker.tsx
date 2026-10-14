"use client";

import { useState } from "react";
import { ALLERGENS, type AllergenId } from "@/data/allergens";
import type { AllergyProfile } from "@/lib/types";

interface Props {
  initial: AllergyProfile | null;
  onSave: (profile: AllergyProfile) => void;
}

export function AllergyPicker({ initial, onSave }: Props) {
  const [selected, setSelected] = useState<Set<AllergenId>>(new Set(initial?.allergens));
  const [custom, setCustom] = useState<string[]>(initial?.custom ?? []);
  const [draft, setDraft] = useState("");

  function toggle(id: AllergenId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addCustom() {
    const name = draft.trim();
    if (name && !custom.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setCustom([...custom, name]);
    }
    setDraft("");
  }

  const count = selected.size + custom.length;

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold">What are you allergic to?</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Pick everything that applies. This is saved on this device only.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {ALLERGENS.map((a) => {
          const on = selected.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm font-medium transition-colors ${
                on
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100"
                  : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900"
              }`}
            >
              <span aria-hidden className="text-lg">{a.emoji}</span>
              <span className="flex-1">{a.label}</span>
              {on && <span aria-hidden className="text-emerald-600 dark:text-emerald-400">✓</span>}
            </button>
          );
        })}
      </div>

      <div>
        <label htmlFor="custom-allergen" className="text-sm font-medium">
          Something else?
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="custom-allergen"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="e.g. mustard, kiwi, celery"
            className="min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-base dark:border-neutral-800 dark:bg-neutral-900"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!draft.trim()}
            className="rounded-xl border border-neutral-200 px-4 text-sm font-medium disabled:opacity-40 dark:border-neutral-800"
          >
            Add
          </button>
        </div>
        {custom.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {custom.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setCustom(custom.filter((x) => x !== c))}
                  aria-label={`Remove ${c}`}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100"
                >
                  {c} <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={count === 0}
        onClick={() => onSave({ allergens: [...selected], custom })}
        className="rounded-xl bg-emerald-600 py-3.5 font-semibold text-white disabled:bg-neutral-300 dark:disabled:bg-neutral-800 dark:disabled:text-neutral-500"
      >
        {count === 0 ? "Pick at least one" : `Save ${count} allerg${count === 1 ? "y" : "ies"}`}
      </button>
    </section>
  );
}
