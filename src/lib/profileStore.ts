"use client";

import { useSyncExternalStore } from "react";
import type { AllergyProfile } from "./types";

// The allergy profile lives in localStorage so it survives page reloads.
// useSyncExternalStore keeps server rendering (no localStorage) and the
// browser in agreement: the server snapshot is null, meaning "not loaded yet".

const KEY = "allergy-profile-v1";
const listeners = new Set<() => void>();
let cached: AllergyProfile | null | undefined;

function read(): AllergyProfile | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.allergens) || !Array.isArray(parsed.custom)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (cached === undefined) cached = read();
  return cached;
}

export function saveProfile(profile: AllergyProfile) {
  cached = profile;
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    // Private browsing or storage disabled: keep it in memory for this visit.
  }
  listeners.forEach((l) => l());
}

/** Returns the saved profile, null if none, or undefined while loading on the server. */
export function useProfile(): AllergyProfile | null | undefined {
  return useSyncExternalStore(subscribe, getSnapshot, () => undefined);
}
