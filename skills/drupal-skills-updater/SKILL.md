---
name: drupal-skills-updater
description: "Audit, synchronize, and update the drupal-contrib-skills collection against ongoing Drupal Core releases, Drupal Change Records (CRs), Drupal Association GitLab CI changes, and evolving PHPCS/PHPStan standards. Use whenever keeping this repository fresh, updating skill instructions, validating skill formatting, or generating release distribution tarballs."
---

# Drupal Skills Maintainer & Sync Workflow

This skill is designed for AI agents and maintainers of the `drupal-contrib-skills` repository. It provides a standardized procedure to audit, update, and validate the skills in this repository as the Drupal ecosystem and toolchains evolve.

---

## 1. Upstream Monitoring & Audit Checkpoints

When running an update cycle on this repository, inspect these primary sources:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        UPSTREAM SYNC SOURCES                           │
├──────────────────┬─────────────────┬──────────────────┬────────────────┤
│ 1. Change Records│ 2. Core Release │ 3. GitLab CI     │ 4. Linters     │
├──────────────────┼─────────────────┼──────────────────┼────────────────┤
│ drupal.org/      │ Releases &      │ git.drupalcode.  │ coder (PHPCS), │
│ list-changes     │ deprecations in │ org/project/     │ phpstan-drupal,│
│ (filter: drupal) │ 10.4, 11.x, 12.x│ gitlab_templates │ cspell         │
└──────────────────┴─────────────────┴──────────────────┴────────────────┘
```

Consult [docs/upstream-sources.md](./docs/upstream-sources.md) and [docs/drupal-ecosystem-reference.md](/docs/drupal-ecosystem-reference.md) for full endpoint and policy details.

---

## 2. Step-by-Step Update Routine

Follow this 5-step process when updating the repository:

### Step 1: Scan for Deprecations & Architectural Additions
1. Check the Drupal Change Records feed (`https://www.drupal.org/list-changes/drupal`).
2. Identify:
   - Newly deprecated procedural APIs or hooks (e.g. new `#[Hook]` attribute adoptions).
   - Changes in `core_version_requirement` defaults.
   - Deprecations in PHPUnit testing traits or base classes (e.g. `BrowserTestBase`, `WebDriverTestBase`).
3. If new patterns emerge, update:
   - `skills/drupal-standards/SKILL.md`
   - `skills/drupal-core-issue/SKILL.md`
   - `skills/drupal-contrib-issue/SKILL.md`

### Step 2: Check GitLab CI Pipeline Template Changes
1. Inspect commit logs at `https://git.drupalcode.org/project/gitlab_templates/-/commits/main`.
2. Check for:
   - Added pipeline variables or deprecated flags.
   - Matrix updates (PHP versions like PHP 8.4/8.5; database engines).
   - New static analysis or linter requirements.
3. Update `skills/drupal-gitlab-ci/SKILL.md` and `skills/drupal-new-project/SKILL.md`.

### Step 3: Review Security & Governance Policies
1. Check if Drupal.org updated the **Security Advisory Coverage** application requirements or project ownership policies.
2. If policies evolved, update `skills/drupal-security-optin/SKILL.md` and `skills/drupal-project-governance/SKILL.md`.

### Step 4: Validate Skill Metadata
Ensure all skill directories follow the specification:
1. Every skill folder must contain a valid `SKILL.md`.
2. Frontmatter must contain `name:` and `description:` with double-quoted summaries.
3. Ensure all skills are registered in `.claude-plugin/marketplace.json` with appropriate group categorization.

### Step 5: Test & Package the Distribution
Run the validation and packaging script:
```bash
./scripts/package.sh
```
This script checks all YAML frontmatters, validates paths in `marketplace.json`, and builds the release tarball (`drupal-contrib-skills-vX.Y.Z.tar.gz`).

---

## 3. Skill Update Verification Checklist

Before committing updates to this repository:
- [x] All file paths in markdown use markdown link syntax or code formatting.
- [x] Frontmatter description strings are concise and specific.
- [x] `.claude-plugin/marketplace.json` contains matching names and groups.
- [x] `README.md` catalog table reflects any added, modified, or removed skills.
- [x] Release notes or git commit messages document the specific Drupal upstream changes addressed.
