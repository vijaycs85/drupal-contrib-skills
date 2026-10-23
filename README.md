# Drupal Contrib Skills

[![skills.sh](https://img.shields.io/badge/skills.sh-compatible-blue)](https://skills.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A curated collection of open **AI Agent Skills** designed for Drupal Core and Contributed module/theme engineering, issue triaging, code review, test verification, and patch maintenance.

Compatible with [skills.sh](https://skills.sh), [Agent Skills](https://agentskills.io/), Antigravity, Claude Code, GitHub Copilot, Cursor, and any assistant supporting the open Agent Skills specification.

---

## Skills Catalog

| Skill | Group | Description |
| :--- | :--- | :--- |
| **`drupal-core-issue`** | `core`, `review` | Workflow for resolving and reviewing Drupal Core issue queue tickets, issue forks, DDEV PHPUnit tests, and drupal.org comment drafts. |
| **`drupal-contrib-issue`** | `contrib`, `review` | Contrib workflow supporting both traditional Drupal.org issue queues and modern native GitLab issues (`git.drupalcode.org/project/<module>/-/issues`). |
| **`drupal-standards`** | `standards`, `core`, `contrib` | Enforces Drupal coding standards (PHPCS `Drupal`, `DrupalPractice`), PHPStan static analysis (`mglaman/phpstan-drupal`), deprecations, and architectural rules. |
| **`drupal-patch-reroll`** | `maintenance` | Systematic workflow to audit failing composer patches, find upstream GitLab MR diffs, resolve `.rej` files, and reroll clean `-p1` patches. |

---

## Installation via `skills.sh`

### Install by Group

Install a tailored bundle based on your role:

```bash
# For Drupal Core contributors and reviewers
npx skills add vijaycs85/drupal-contrib-skills --group core

# For Contrib module/theme developers
npx skills add vijaycs85/drupal-contrib-skills --group contrib

# For Code Reviewers (Core + Contrib)
npx skills add vijaycs85/drupal-contrib-skills --group review

# For Coding Standards and static analysis rules only
npx skills add vijaycs85/drupal-contrib-skills --group standards

# For Composer patch maintenance and rerolling
npx skills add vijaycs85/drupal-contrib-skills --group maintenance
```

### Install the Entire Collection

```bash
npx skills add vijaycs85/drupal-contrib-skills
```

---

## Manual Installation

To install skills directly into your local configuration without the CLI:

### Global (All Projects)
Clone or copy the skill directories into your global agent directory:
```bash
# Example for Antigravity / Gemini CLI
git clone https://github.com/vijaycs85/drupal-contrib-skills.git /tmp/drupal-contrib-skills
cp -r /tmp/drupal-contrib-skills/skills/* ~/.gemini/config/skills/

# Example for Claude Code
cp -r /tmp/drupal-contrib-skills/skills/* ~/.claude/skills/
```

### Project-Specific (Workspace)
Copy skills into your project's `.agents/skills/` directory:
```bash
mkdir -p .agents/skills
cp -r /path/to/drupal-contrib-skills/skills/* .agents/skills/
```

---

## Overview of Workflows

### 1. `drupal-core-issue`
* Connects to `git@git.drupal.org:issue/drupal-<nid>.git` issue forks.
* Syncs with merge base (`origin/main`, `origin/11.x`, `origin/10.4.x`).
* Executes PHPUnit functional/kernel tests and PHPCS inside DDEV.
* Formats structured review comments for the Drupal.org issue queue.

### 2. `drupal-contrib-issue`
* **Dual-mode support**: Automatically recognizes whether a project uses the legacy Drupal.org issue queue or native GitLab issues (`git.drupalcode.org/project/<module>/-/issues`).
* Sets up module testing inside local DDEV Drupal sites or checks GitLab CI pipeline configurations (`.gitlab-ci.yml`).
* Audits compatibility against `core_version_requirement`.

### 3. `drupal-standards`
* PHPCS rules (`Drupal`, `DrupalPractice`, 2 spaces, strictly typed).
* Entity-safe checks (avoiding `NoCorrespondingEntityClassException` during early bootstrap/install).
* Modern Hook conversions (`#[Hook]` attributes) and Dependency Injection rules.

### 4. `drupal-patch-reroll`
* Audits failing patches from `cweagans/composer-patches`.
* Resolves `.rej` reject hunks cleanly.
* Generates standard `-p1` patches ready for composer.

---

## License

This project is licensed under the [MIT License](LICENSE).
