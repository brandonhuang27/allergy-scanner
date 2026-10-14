"use client";

import { createLocalStore } from "./localStore";
import type { AllergyProfile } from "./types";

const profileStore = createLocalStore(
  "allergy-profile-v1",
  (v): v is AllergyProfile =>
    typeof v === "object" &&
    v !== null &&
    Array.isArray((v as AllergyProfile).allergens) &&
    Array.isArray((v as AllergyProfile).custom),
);

export const saveProfile = profileStore.set;
export const useProfile = profileStore.useValue;

const accessCodeStore = createLocalStore(
  "access-code-v1",
  (v): v is string => typeof v === "string",
);

export const saveAccessCode = accessCodeStore.set;
export const getAccessCode = accessCodeStore.get;
export const useAccessCode = accessCodeStore.useValue;
