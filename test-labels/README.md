# Label tests

Checks that the scanner catches every allergen on a set of known labels.

```
npm run test:labels                  # run every case (~$0.04 per case)
npm run test:labels -- --only ja     # only cases whose image name contains "ja"
npm run test:labels -- --repeat 3    # run each case 3 times to check consistency
```

**Missed allergens must be 0.** A miss means an allergen on the label was not
flagged at all, which is the one mistake this app can't afford. False alarms
and noise are worth watching but are much less serious.

Full results from each run are saved in `results/` (not committed).

## Adding a real photo

1. Put the photo in `images/`, e.g. `images/trader-joes-granola.jpg`.
   Phone photos are fine as-is; the script resizes them the same way the app does.
2. Read the label yourself and add an entry to `cases.json`:

```json
{
  "image": "trader-joes-granola.jpg",
  "allergens": ["tree-nuts", "milk", "gluten", "peanuts"],
  "expect": {
    "contains": ["tree-nuts", "gluten"],
    "possible": ["peanuts"],
    "absent": ["milk"]
  },
  "notes": "Almonds and oats; 'may contain peanuts' warning."
}
```

- `allergens`: which allergies to test with. Ids: `milk`, `eggs`, `peanuts`,
  `tree-nuts`, `soy`, `wheat`, `gluten`, `fish`, `shellfish`, `sesame`.
  Add `"custom": ["kiwi"]` for anything else.
- `contains`: allergens clearly in the ingredients. They must be flagged as "contains".
- `possible`: "may contain" warnings or ambiguous ingredients. They must be flagged
  (as contains or possible).
- `absent`: allergens that aren't on the label. Flagging one as "contains" counts
  as a false alarm.
- For a photo that is deliberately too blurry to read, use `"unreadable": true`
  and leave out `expect`.

The most useful photos are the hard ones: foreign languages, small print,
curved packaging, glare, labels with no "Contains" line, and allergens hidden
under unusual names.
