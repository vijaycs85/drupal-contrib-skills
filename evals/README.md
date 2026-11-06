# Drupal Skills Automated Evaluation Framework (TypeScript & pnpm)

This directory contains the automated evaluation framework for `drupal-contrib-skills`. It provides reproducible, grounded testing of AI agent skills across synthetic project fixtures without requiring live Drupal.org queue access or Git merges.

---

## Directory Architecture

```
evals/
├── README.md                      # Framework documentation (this file)
├── runner/                        # TypeScript CLI runner and execution adapters
│   ├── cli.ts                     # CLI entrypoint (pnpm eval)
│   ├── types.ts                   # Types and interfaces
│   ├── EvaluationRunner.ts        # Sandbox orchestration, trial loops, and reports
│   └── adapters/
│       ├── MockAdapter.ts         # Fast deterministic mock adapter (for unit & offline CI tests)
│       ├── ApiAdapter.ts          # Direct headless LLM adapter (Gemini, Claude, OpenAI)
│       └── SubprocessAdapter.ts   # Subprocess adapter for local CLI agents (Claude Code, Antigravity)
├── graders/                       # Quality graders and verification assertions
│   ├── ExecutableGrader.ts        # File presence, regex patterns, syntax, and custom commands
│   └── RubricGrader.ts            # 6-dimension AI rubric grading (0-4 per dimension)
├── fixtures/                      # Isolated synthetic Drupal fixtures
│   ├── drupal-webform-app/        # Drupal 10.3 + Webform locked dependencies
│   ├── drupal-core-clean/         # Clean Drupal Core 10.3 project
│   ├── drupal-version-mismatch/   # composer.lock vs local source divergence
│   └── drupal-contrib-issue-fork/ # Contrib module issue queue with patch samples
└── cases/                         # Evaluation test cases by skill
    ├── drupal-solution-api-reference/
    │   ├── capability-discovery/  # Reuse existing Webform vs building bespoke modules
    │   ├── dependency-layers/     # WebformHandler plugin extending owning contract
    │   ├── core-only/             # Route access checks via Drupal Core Access API
    │   └── version-mismatch/      # Detects lockfile vs source discrepancy
    └── drupal-contrib-issue/
        ├── defective-change/      # Reviews patch with regression; states verification limits
        └── clean-change/          # Reviews clean patch; accurately reports testing limits
```

---

## Getting Started

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Run Mock Evaluation (Fast Offline Smoke Test)
Verify all 6 test cases, synthetic fixtures, and executable checks without needing external API keys or CLIs:
```bash
pnpm eval:mock
```

To run baseline comparison (with skill vs without skill):
```bash
pnpm eval:baseline
```

### 3. Filter by Skill or Specific Case
```bash
# Evaluate only drupal-solution-api-reference
pnpm eval --skill=drupal-solution-api-reference

# Evaluate only a specific case
pnpm eval --case=capability-discovery
```

### 4. Running with Live LLMs (Gemini, Claude, OpenAI)
Set your API key in environment variables:
```bash
# Using Google Gemini (e.g. Gemini 2.5 Flash)
export GEMINI_API_KEY="your-gemini-key"
pnpm eval:gemini

# Using Anthropic Claude (e.g. Claude 3.5 Sonnet)
export ANTHROPIC_API_KEY="your-anthropic-key"
pnpm eval:claude

# Using OpenAI (e.g. GPT-4o)
export OPENAI_API_KEY="your-openai-key"
pnpm eval:openai
```

### 5. Running with an External CLI Agent (Claude Code / Antigravity CLI)
```bash
pnpm eval --adapter=subprocess --command='claude -p "{prompt}"'
```

---

## The 6-Dimension AI Quality Rubric

Every evaluated run is scored against six fixed dimensions (scored 0–4 and normalized to a 100-point scale):

| Dimension | Description |
| :--- | :--- |
| **`requirement_fit`** | Translates domain requests into essential acceptance criteria; solution is proportionate. |
| **`ecosystem_choice`** | Reuses existing installed facilities (core/contrib); avoids unnecessary new modules. |
| **`api_grounding`** | Implementation strictly adheres to verified interfaces, services, and locked versions. |
| **`verification_honesty`** | Accurately states what checks were run; never claims unrun test passes. |
| **`maintainability_semantics`** | Follows Drupal standards (dependency injection, access control, cache tags, schemas). |
| **`communication`** | Clear, concise response citing verified patterns without extraneous chatter. |
