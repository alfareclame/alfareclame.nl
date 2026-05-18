# alfareclame.nl — Design Refinement Agent

Autonomous Claude Sonnet 4.6 agent that iteratively improves the homepage design via the 21st.dev SDK. Runs as a Node script — does NOT live in the deployed static site.

## What it does

- Reads `index.html` design state
- Picks one focused improvement per turn (mobile spacing, focus states, hover polish, type hierarchy, etc.)
- Applies surgical edits, verifies with `git diff`, commits + pushes
- Submits IndexNow ping after each push
- Loops until budget (`$2`) or turn cap (`30`) is reached

## Setup (one-time)

From `tools/design-agent/`:

```bash
npm install
```

Authenticate with 21st.dev (opens a browser, returns an API key):

```bash
npm run login
# equivalent to: npx @21st-sdk/cli login
```

Copy `.env.example` to `.env` and paste your `API_KEY_21ST`:

```bash
cp .env.example .env
# then edit .env
```

The repo root `.gitignore` already excludes `node_modules/` and `.env`.

## Run

```bash
npm run agent
```

The agent will:

1. Call `getDesignGoals()` to load the active improvement backlog
2. Pick one item, propose the change in plain language
3. Apply via the Edit tool
4. Commit + push to `main`
5. Ping IndexNow
6. Repeat

Stop early with `Ctrl-C` — the most recent commit is already pushed.

## Deploy to E2B sandbox (optional)

If you want to run the agent in a remote sandbox instead of your local machine:

```bash
npm run deploy
# equivalent to: npx @21st-sdk/cli deploy
```

This bundles the agent + dependencies and runs it in an E2B sandbox.

## Hard constraints baked into the agent

- Site is static HTML on Cloudflare Pages — no React, no build pipeline
- All JSON-LD, schema, and meta tags are preserved
- Phone number `+31 6 24 74 15 97` is preserved (never reverted)
- No stock photos, no AI-generated assets — only `/public/images/portfolio/*`
- Lighthouse budgets respected: a11y >= 90, perf >= 80, SEO >= 95
- Never runs destructive git ops without explicit approval

## Files

```
tools/design-agent/
├── agent.ts          ← agent definition + custom tools
├── package.json      ← deps + scripts
├── tsconfig.json     ← TypeScript config
├── .env.example      ← template (real .env is gitignored)
└── README.md         ← this file
```

## Security reminder

The `API_KEY_21ST` is a secret. If it ever appears in chat logs, a public repo, or a screenshot, **rotate it immediately** at https://21st.dev (Dashboard → API Keys → Revoke + Generate new).
