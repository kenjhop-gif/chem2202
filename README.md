# Chem 2202 Step Coach

A study companion for NL Chemistry 2202: learn it, see it worked out, then practise with step-by-step guidance and hints. See [PLAN.md](PLAN.md) for the full plan and decisions.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Other commands

- `npm test` runs the engine tests and generates hundreds of questions per template to check every answer is self-consistent.
- `npm run build` type-checks and builds to `dist/` (static files, ready for GitHub Pages).

## Where things live

| Path | What |
|---|---|
| `src/content/curriculum.ts` | The full 60-topic map |
| `src/content/topics/*.ts` | Written topics: explanation, examples, step guide, question generators, videos |
| `src/content/registry.ts` | Which topics are ready (others show "Coming soon") |
| `src/data/elements.ts` | NL Periodic Chart (2019-20) values |
| `src/engine/` | Number and sig-fig parsing, formula parsing, answer checking |
| `src/practice/` | The guided practice screen |
| `src/theme/themes.ts` | Color themes (one color per course section) |
| `src/progress/` | Saved progress and preferences (local for now; Firestore later) |
