import type { AllergenId } from "@/data/allergens";

/** What the user is allergic to. Custom entries are free text ("kiwi", "mustard"). */
export interface AllergyProfile {
  allergens: AllergenId[];
  custom: string[];
}

/**
 * contains: the label clearly lists it.
 * possible: an ambiguous ingredient or a "may contain" warning.
 * unknown:  the text was unreadable or too unclear to judge.
 */
export type Verdict = "contains" | "possible" | "unknown";

export interface Finding {
  verdict: Verdict;
  /** Menus only: the dish this finding is about, e.g. "Pad Thai". Empty for labels. */
  dish?: string;
  /** An AllergenId, or a custom allergen exactly as the user typed it. */
  allergen: string;
  /** The text as printed on the label, in its original language. */
  originalText: string;
  /** English translation of originalText (same as originalText if already English). */
  translation: string;
  /** Plain-language explanation of why this was flagged. */
  reason: string;
}

export interface ScanResult {
  /** Whether the photo was a packaged food label or a menu. */
  kind: "label" | "menu";
  /** False when the photo was too blurry, cropped, or not an ingredient label. */
  readable: boolean;
  /** e.g. "German". Empty when unreadable. */
  detectedLanguage: string;
  /** Ingredient list (or menu text) as read from the photo, for the user to double-check. */
  ingredientsText: string;
  findings: Finding[];
  /** Shown to the user when something about the photo needs attention. */
  message?: string;
}
