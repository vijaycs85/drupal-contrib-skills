# Drupal Contrib Skills

[![skills.sh](https://img.shields.io/badge/skills.sh-compatible-blue)](https://skills.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A curated collection of open **AI Agent Skills** designed for Drupal Core and Contributed module, theme, starterkit, and recipe engineering, issue triaging, security reviews, test verification, and project lifecycle maintenance.

Compatible with [skills.sh](https://skills.sh), [Agent Skills](https://agentskills.io/), Antigravity, Claude Code, GitHub Copilot, Cursor, and any assistant supporting the open Agent Skills specification.

---

## Skills Catalog

| Skill | Group | Description |
| :--- | :--- | :--- |
| **`drupal-core-issue`** | `core`, `review` | Workflow for resolving and reviewing Drupal Core issue tickets, issue forks, DDEV PHPUnit tests, Conventional Commits with `By:` trailers, and drupal.org comment drafts. |
| **`drupal-contrib-issue`** | `contrib`, `review` | Contrib workflow supporting both traditional Drupal.org issue queues and modern native GitLab issues (`git.drupalcode.org/project/<module>/-/issues`). |
| **`drupal-standards`** | `standards`, `core`, `contrib` | Enforces Drupal coding standards (PHPCS `Drupal`, `DrupalPractice`), PHPStan Drupal static analysis, PHP 8 `#[Hook]` & plugin attributes, and strict config schemas. |
| **`drupal-patch-reroll`** | `maintenance` | Systematic workflow to audit failing composer patches (v1 & v2 plugins), find upstream GitLab MR diffs, resolve `.rej` files, and reroll clean `-p1` patches. |
| **`drupal-new-project`** | `contrib`, `lifecycle` | Scaffolding and launching new modules, themes, starterkits, or recipes. Enforces machine name rules, mandatory boilerplate files, Git branches, and GitLab CI. |
| **`drupal-security-optin`** | `maintainer`, `security` | Pre-audit checklist (SQLi, XSS, CSRF, `accessCheck(TRUE)`) and step-by-step guide to pass the Drupal.org Security Advisory (SA) Coverage review application. |
| **`drupal-release-management`** | `maintainer`, `lifecycle` | Semantic versioning releases, release branches (`1.0.x`), release notes generation, tag publishing, release nodes, and coordinated security releases. |
| **`drupal-project-governance`** | `maintainer`, `lifecycle` | Abandoned project takeover (mandatory 14-day queue process), onboarding co-maintainers, deprecating projects, and migrating to GitLab issues. |
| **`drupal-gitlab-ci`** | `contrib`, `ci` | Configuring, debugging, and customizing official Drupal Association GitLab CI/CD pipelines (`include.drupalci.main.yml`), test matrices, and linters. |
| **`drupal-recipe-authoring`** | `recipes`, `contrib` | Authoring, testing, and distributing Drupal Recipes (`recipe.yml`). Uses the Config Actions API, module dependencies, and demo content. |
| **`drupal-skills-updater`** | `meta`, `maintenance` | Maintenance workflow to audit and synchronize this skill collection against ongoing Drupal Core releases, Drupal Change Records, and GitLab CI changes. |

---

## Installation via Composer (Recommended for Drupal Projects)

This repository is a standard Composer package fully integrated with the official Drupal community [**AI Best Practices** (`drupal/ai_best_practices`)](https://www.drupal.org/project/ai_best_practices) Composer plugin.

### Automatic Discovery via `drupal/ai_best_practices`

When your Drupal site uses `drupal/ai_best_practices`, simply require this package:

```bash
composer require --dev vijaycs85/drupal-contrib-skills
```

The `ai_best_practices` plugin automatically:
1. **Scans** `vendor/vijaycs85/drupal-contrib-skills/skills/`.
2. **Discovers & validates** all 11 skills.
3. **Synchronizes** them directly into `.agents/skills/` (or `.claude/skills/`).
4. **Auto-updates** them whenever you run `composer update vijaycs85/drupal-contrib-skills`.

### Manual Linking (Without `ai_best_practices`)

If your project does not use `drupal/ai_best_practices`, link the skills into your workspace:

```bash
mkdir -p .agents
ln -sfn ../vendor/vijaycs85/drupal-contrib-skills/skills .agents/skills
```

---

## Installation via `skills.sh`

### Install by Role Group

Install a tailored bundle based on your role in the Drupal ecosystem:

```bash
# For Drupal Core contributors and reviewers
npx skills add vijaycs85/drupal-contrib-skills --group core

# For Contributed module, theme, and recipe developers
npx skills add vijaycs85/drupal-contrib-skills --group contrib

# For Project Maintainers, Owners, and Security Applicants
npx skills add vijaycs85/drupal-contrib-skills --group maintainer

# For Coding Standards, static analysis, and configuration schema validation
npx skills add vijaycs85/drupal-contrib-skills --group standards

# For Drupal Recipe creators
npx skills add vijaycs85/drupal-contrib-skills --group recipes

# For Composer patch maintenance and rerolling
npx skills add vijaycs85/drupal-contrib-skills --group maintenance
```

### Install the Entire Collection

```bash
npx skills add vijaycs85/drupal-contrib-skills
```

---

## Tarball Distribution Package

This repository packages directly as a release tarball for offline, air-gapped, or manual installation into any AI agent environment:

### Building the Tarball
```bash
./scripts/package.sh 1.0.0
```
This generates `drupal-contrib-skills-v1.0.0.tar.gz`.

### Unpacking into Global Agent Environments
```bash
# Global installation for Antigravity / Gemini CLI
tar -xzf drupal-contrib-skills-v1.0.0.tar.gz -C ~/.gemini/config/skills/

# Global installation for Claude Code
tar -xzf drupal-contrib-skills-v1.0.0.tar.gz -C ~/.claude/skills/
```

### Unpacking into a Local Project Workspace
```bash
mkdir -p .agents/skills
tar -xzf drupal-contrib-skills-v1.0.0.tar.gz -C .agents/skills/
```

---

## Knowledge Base & Keeping Skills Fresh

This repository includes a canonical knowledge base to record policies, upstream feeds, and procedures:
- **[Drupal Ecosystem Reference](docs/drupal-ecosystem-reference.md)**: Policies on naming, mandatory boilerplate, credit attribution, security review criteria, and project takeover rules.
- **[Upstream Monitoring Sources](docs/upstream-sources.md)**: Feeds and links for tracking Drupal Change Records (CRs), core release notes, and GitLab CI template updates.
- **[`drupal-skills-updater`](skills/drupal-skills-updater/SKILL.md)**: An AI agent skill designed specifically to audit, update, and validate this repository against the latest Drupal changes.

---

## License

This project is licensed under the [MIT License](LICENSE).
