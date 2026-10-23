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
   - Issue Status: Active, Needs work, Needs review, RTBC.
   - Target Version: `main` (Drupal 12 / next major), `11.x`, `11.4.x`, etc.
   - Issue Summary: Problem/Motivation, Proposed resolution, Remaining tasks.
   - Latest comments: Read recent feedback, especially reviewer notes and test bot results.
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

# Alternatively, fetch specific MR ref
git fetch origin merge-requests/<mr_id>/head:mr-<mr_id>
git checkout mr-<mr_id>
```

### Keeping the Branch Up-to-Date
Core branches move fast. Always keep the issue branch synced with the merge base:
```bash
git fetch origin
git merge origin/<target_branch>
```

---

## 3. Environment & Testing Verification

Drupal Core development is ideally paired with **DDEV**.

### 1. DDEV Configuration for Core
```bash
# Configure for modern Drupal Core
ddev config --project-name=drupal-core --project-type=drupal12 --docroot=. --php-version=8.5
ddev start
ddev composer install
```

### 2. Code Quality & Static Analysis Checks
Always verify before committing:
```bash
# PHPCS (Drupal standards)
ddev exec vendor/bin/phpcs --standard=Drupal,DrupalPractice core/path/to/modified/file.php

# PHPStan (Core level)
ddev exec vendor/bin/phpstan analyze core/path/to/modified/file.php
```

### 3. Running Core Automated Tests
Functional and Kernel tests require database and base URL environment variables:
```bash
# Functional tests
ddev exec "SIMPLETEST_BASE_URL=http://localhost SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c core core/tests/Drupal/FunctionalTests/PathToTest.php"

# Kernel tests
ddev exec "SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c core core/tests/Drupal/KernelTests/PathToTest.php"

# Unit tests
ddev exec vendor/bin/phpunit -c core core/tests/Drupal/Tests/PathToTest.php
```

---

## 4. Addressing Review Feedback & Pitfalls

### Common Core Pitfalls
1. **Early Bootstrap / Installer Assumptions**:
   - Never call `User::load()` or entity storage before checking that the container and entity definition exist:
     ```php
     \Drupal::hasContainer()
     && \Drupal::hasService('entity_type.manager')
     && \Drupal::entityTypeManager()->hasDefinition('user')
     ```
   - Classes can be autoloaded (`class_exists()`), but their entity definitions might not yet be installed in the container.
2. **Backwards Compatibility (BC)**:
   - Public and protected APIs cannot change signatures in minor releases without deprecation shims.
   - Deprecate rather than remove.

---

## 5. Drafting Drupal.org Issue Feedback

When changes are pushed to the MR, summarize the resolution in a comment on Drupal.org:

### Standard Comment Template
```markdown
### Summary of Changes in [MR !<mr_id>](https://git.drupalcode.org/project/drupal/-/merge_requests/<mr_id>)

1. **Addressed Feedback from #<comment_number>**:
   - Explanation of the root cause.
   - Specific fix implemented.

2. **Testing & Standards**:
   - PHPCS: Passed with 0 errors (`Drupal`, `DrupalPractice`).
   - PHPStan: Passed with 0 errors.
   - PHPUnit: Tests ran and passed (`<test-class-name>`, X assertions, 0 failures).

Setting status to **Needs review**.
```
