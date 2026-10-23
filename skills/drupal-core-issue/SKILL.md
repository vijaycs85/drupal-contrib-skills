---
name: drupal-core-issue
description: "Workflow for resolving, testing, and reviewing issues in Drupal Core. Use whenever working on a Drupal Core issue queue ticket (drupal.org/project/drupal/issues/*), managing git.drupalcode.org issue forks, running Drupal Core PHPUnit tests (Unit, Kernel, Functional, FunctionalJavascript) with DDEV or local environments, verifying PHPCS and PHPStan on core changes, and drafting review comments for core maintainers."
---

# Drupal Core Issue & Review Workflow

This skill guides the end-to-end process of working on, testing, and reviewing Drupal Core issues hosted on Drupal.org and GitLab.

---

## 1. Inspecting the Drupal.org Issue & Merge Request

When given a Drupal.org issue URL (e.g. `https://www.drupal.org/project/drupal/issues/3455853`):

1. **Review Issue Details**:
   - **Issue Status**: Active, Needs work, Needs review, RTBC (Reviewed & tested by the community).
   - **Target Version**: `main` (Drupal 12 / next major), `11.x`, `11.4.x`, etc. All new features target `main`; bug fixes target active minor branches.
   - **Issue Summary**: Problem/Motivation, Proposed resolution, Remaining tasks, User interface changes, API changes.
   - **Latest comments**: Read recent feedback, especially committer notes and test bot results.
2. **Locate the GitLab Merge Request**:
   - Find the linked MR on `https://git.drupalcode.org/project/drupal/-/merge_requests/<mr_id>`.
   - Note the issue fork repository: `git@git.drupal.org:issue/drupal-<nid>.git`.
   - Note the issue branch name (e.g., `<nid>-prevent-reinstall-main`).

---

## 2. Git Setup for Issue Forks

### Adding the Issue Fork Remote
```bash
# Add the remote if not already added
git remote add drupal-<nid> git@git.drupal.org:issue/drupal-<nid>.git

# Fetch the remote branches
git fetch drupal-<nid>
```

### Checking out the Issue Branch
```bash
# Checkout the branch matching the MR
git checkout -b <branch_name> drupal-<nid>/<branch_name>

# Alternatively, fetch specific MR ref directly from origin
git fetch origin merge-requests/<mr_id>/head:mr-<mr_id>
git checkout mr-<mr_id>
```

### Keeping the Branch Up-to-Date (Rebasing against Core)
Core moves fast. Always ensure your branch is rebased on the latest merge target before running tests or requesting RTBC:
```bash
# Fetch latest core main branch
git fetch origin main

# Rebase your issue branch onto origin/main
git rebase origin/main

# If conflicts occur, resolve them, add the files, and continue
git add <conflicted_file>
git rebase --continue

# Push updated commits to the issue fork (force-with-lease)
git push --force-with-lease drupal-<nid> <branch_name>
```

---

## 3. Core Commit Message Standards (Conventional Commits)

Drupal Core uses the **Conventional Commits** specification with **`By:` trailers** for credit attribution:

### Syntax Format
```text
{type}: #{issue_id} One-line concise summary of the change
By: username1
By: username2
```

### Supported Types:
- `fix`: Bug fixes.
- `feat`: New features or substantial API additions.
- `task`: Maintenance tasks (replaces `chore`).
- `docs`: Documentation updates.
- `test`: Adding or refactoring automated tests.
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `perf`: Performance improvements.
- `ci`: Changes to CI/CD configuration.

### Example:
```text
fix: #3489123 Prevent null pointer in entity canonical route access check
By: alex_p
By: catch
By: quietone
```

> [!NOTE]
> Git commit trailers provide human-readable repository attribution. Maintainers formally grant official Drupal.org contribution credit in the issue queue web interface when closing tickets as *Fixed*.

---

## 4. Quality Verification & Core Automated Testing

### Static Analysis & Standards
Always verify before pushing to the issue fork:
```bash
# PHPCS (Drupal & DrupalPractice standards)
ddev exec vendor/bin/phpcs --standard=Drupal,DrupalPractice core/path/to/modified/file.php

# PHPStan (Core baseline)
ddev exec vendor/bin/phpstan analyze core/path/to/modified/file.php

# CSpell dictionary check
ddev exec npm --prefix core run spellcheck
```

### Running Core Automated Tests
Functional and Kernel tests require database and base URL environment variables:
```bash
# Functional tests (browser simulation)
ddev exec "SIMPLETEST_BASE_URL=http://localhost SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c core core/tests/Drupal/FunctionalTests/PathToTest.php"

# Functional Javascript tests (WebDriver / Chromium)
ddev exec "SIMPLETEST_BASE_URL=http://localhost SIMPLETEST_DB=mysql://db:db@db/db MINK_DRIVER_ARGS_WEBDRIVER='[\"chrome\", {\"browserName\":\"chrome\",\"goog:chromeOptions\":{\"args\":[\"--disable-gpu\",\"--headless\", \"--no-sandbox\"]}}, \"http://chrome:9515\"]' vendor/bin/phpunit -c core core/tests/Drupal/FunctionalJavascriptTests/PathToTest.php"

# Kernel tests (headless DB interaction)
ddev exec "SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c core core/tests/Drupal/KernelTests/PathToTest.php"

# Unit tests (isolated PHP logic)
ddev exec vendor/bin/phpunit -c core core/tests/Drupal/Tests/PathToTest.php
```

---

## 5. Addressing Core Pitfalls & Governance

1. **Early Bootstrap & Installer Assumptions**:
   - Never assume entity types exist or services are registered in early bootstrap or installer contexts:
     ```php
     \Drupal::hasContainer()
     && \Drupal::hasService('entity_type.manager')
     && \Drupal::entityTypeManager()->hasDefinition('user')
     ```
2. **Backwards Compatibility (BC) Promise**:
   - Public and protected APIs cannot break signatures in minor releases.
   - Deprecate parameters/classes using `@deprecated` and `@trigger_error(..., E_USER_DEPRECATED)`.
3. **Change Records (CR)**:
   - If an API is deprecated or added, a Change Record must be filed on `drupal.org/node/add/changenotice` before setting to RTBC.
4. **Issue Tags**:
   - Tag with `Novice` only if tasks are clearly defined for new contributors.
   - Add `Needs tests`, `Needs change record`, or `Accessibility` where applicable.

---

## 6. Drafting Drupal.org Issue Feedback & RTBC Reviews

When changes are pushed to the MR or reviewing someone else's work:

### Review & Verification Template
```markdown
### Review of [MR !<mr_id>](https://git.drupalcode.org/project/drupal/-/merge_requests/<mr_id>)

1. **Manual Testing Summary**:
   - **Environment**: DDEV, PHP 8.3, MySQL 8.0, Drupal 11.x.
   - **Steps to reproduce**:
     1. Navigated to `/admin/structure/...`
     2. Attempted to trigger condition...
   - **Result Before**: Threw `TypeError: ...`
   - **Result After**: Handled cleanly with user notification.

2. **Automated Tests & Quality**:
   - PHPCS: Passed (`Drupal`, `DrupalPractice`).
   - PHPStan: 0 errors.
   - PHPUnit: New test `PathToTest::testBugResolution()` added and passes.

3. **Status Recommendation**:
   - Marking as **Reviewed & tested by the community (RTBC)**.
```
