import type { AllergyProfile, Finding, ScanResult } from "./types";

// PART 2 PLACEHOLDER: returns a fake result for a German chocolate bar so the
// screens can be built and tested. Part 3 replaces this with a call to the
// /api/analyze route, which sends the photo to Claude.

const MOCK_INGREDIENTS =
  "Zutaten: Zucker, Kakaobutter, Vollmilchpulver, Kakaomasse, Haselnüsse (8%), " +
  "Emulgator: Lecithine (Soja), natürliches Aroma. Kann Spuren von Erdnüssen enthalten.";

const MOCK_FINDINGS: Finding[] = [
  {
    verdict: "contains",
    allergen: "milk",
    originalText: "Vollmilchpulver",
    translation: "whole milk powder",
    reason: "Milk powder is a dairy ingredient.",
  },
  {
    verdict: "contains",
    allergen: "tree-nuts",
    originalText: "Haselnüsse (8%)",
    translation: "hazelnuts (8%)",
    reason: "Hazelnuts are a tree nut.",
  },
  {
    verdict: "contains",
    allergen: "soy",
    originalText: "Emulgator: Lecithine (Soja)",
    translation: "emulsifier: lecithins (soy)",
    reason: "The lecithin is labeled as coming from soy.",
  },
  {
    verdict: "possible",
    allergen: "peanuts",
    originalText: "Kann Spuren von Erdnüssen enthalten",
    translation: "May contain traces of peanuts",
    reason: "Cross-contact warning: peanuts are handled in the same facility.",
  },
  {
    verdict: "possible",
    allergen: "milk",
    originalText: "natürliches Aroma",
    translation: "natural flavoring",
    reason: "Natural flavorings can contain milk derivatives; the source isn't stated.",
  },
];

export async function analyzeLabel(
  _imageDataUrl: string,
  profile: AllergyProfile,
): Promise<ScanResult> {
  await new Promise((r) => setTimeout(r, 1200));
  const selected = new Set<string>(profile.allergens);
  return {
    readable: true,
    detectedLanguage: "German",
    ingredientsText: MOCK_INGREDIENTS,
    findings: MOCK_FINDINGS.filter((f) => selected.has(f.allergen)),
  };
}
