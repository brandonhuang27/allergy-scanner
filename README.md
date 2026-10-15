# Allergy Scanner

Scan a food ingredient label in any language and see which of your allergens it
contains, may contain, or couldn't be checked. Built with Next.js, the Claude
API and Supabase, hosted on Vercel.

The app never says a food is safe. It helps people spot risks; they still
decide.

## Running locally

Requires Node 22 (`nvm use` picks it up from `.nvmrc`).

```
nvm use
npm install
npm run dev
```

Then open http://localhost:3000.

Settings go in `.env.local` (never committed):

| Variable | What it is |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key, from console.anthropic.com |
| `ACCESS_CODE` | Code testers enter before scanning. Optional locally, required in production |
| `SUPABASE_URL` | Supabase project URL (`https://xxxx.supabase.co`), for feedback |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_...`), for feedback |

The same variables are set in the Vercel project for the live site. Run
`supabase/schema.sql` once in the Supabase SQL Editor to create the feedback
table and photo bucket.

## How it works

- `src/data/allergens.ts`: the allergens users can pick, with their other
  names in 8 languages.
- `src/lib/prompt.ts`: the instructions sent to Claude with each photo.
- `src/lib/claudeAnalysis.ts`: the Claude call, shared by the app and the tests.
- `src/app/api/analyze`: the scan endpoint. `src/app/api/feedback` saves
  thumbs up / down to Supabase.

## Testing accuracy

`npm run test:labels` runs every label in `test-labels/` through the same
analysis and reports missed allergens, which must stay at 0. See
`test-labels/README.md` to add photos. Each run costs a few cents per label.

## Deploying

Pushing to `main` deploys to production on Vercel automatically.
