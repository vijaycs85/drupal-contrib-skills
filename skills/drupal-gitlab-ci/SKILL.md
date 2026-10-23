---
name: drupal-gitlab-ci
description: "Configuring, debugging, and customizing official Drupal Association GitLab CI/CD pipelines (.gitlab-ci.yml) for contributed modules, themes, and recipes. Covers pipeline variables (test matrices, core versions, skipping linters), debugging failed CI jobs (composer validate, phpcs, phpstan, cspell, phpunit), and extending default testing templates."
---

# Drupal GitLab CI Configuration & Troubleshooting

Drupal uses centralized GitLab CI/CD templates maintained by the Drupal Association to run automated testing, linting, code quality checks, and compatibility matrices on `git.drupalcode.org`.

---

## 1. Official `.gitlab-ci.yml` Template

The standard configuration imports centralized templates that automatically inherit upstream improvements:

```yaml
#################
# DrupalCI GitLabCI template
# Based on: https://git.drupalcode.org/project/gitlab_templates
#################

include:
  - project: $_GITLAB_TEMPLATES_REPO
    ref: $_GITLAB_TEMPLATES_REF
    file:
      - '/includes/include.drupalci.main.yml'
      - '/includes/include.drupalci.variables.yml'
      - '/includes/include.drupalci.workflows.yml'

# Optional customizations and pipeline variable overrides:
# variables:
#   OPT_IN_TEST_PREVIOUS_MINOR: '1'
#   OPT_IN_TEST_NEXT_MAJOR: '1'
#   SKIP_ESLINT: '1'
#   _PHPUNIT_CONCURRENT: '1'
```

---

## 2. Common Pipeline Configuration Variables

You can tune testing matrices and tool execution by defining variables in your `.gitlab-ci.yml`:

| Variable | Default | Purpose / Effect |
| :--- | :--- | :--- |
| `OPT_IN_TEST_PREVIOUS_MINOR` | `'0'` | Set to `'1'` to run PHPUnit against the previous minor Drupal release (e.g. 10.3 while testing on 10.4). |
| `OPT_IN_TEST_NEXT_MINOR` | `'0'` | Set to `'1'` to run tests against the upcoming minor release dev branch. |
| `OPT_IN_TEST_NEXT_MAJOR` | `'0'` | Set to `'1'` to test forward compatibility with the next major core release (e.g. Drupal 11 on a Drupal 10 module). |
| `_PHPUNIT_CONCURRENT` | `'0'` | Set to `'1'` to execute PHPUnit tests concurrently across database schemas for faster pipeline completion. |
| `SKIP_ESLINT` | `'0'` | Set to `'1'` if the module has no JavaScript or uses an external frontend build pipeline. |
| `SKIP_STYLELINT` | `'0'` | Set to `'1'` if the project has no CSS stylesheets. |
| `SKIP_CSPELL` | `'0'` | Set to `'1'` to bypass CSpell dictionary checks (not recommended). |

### Example with Matrix Overrides:
```yaml
variables:
  OPT_IN_TEST_PREVIOUS_MINOR: '1'
  OPT_IN_TEST_NEXT_MAJOR: '1'
  _PHPUNIT_CONCURRENT: '1'
```

---

## 3. Standard Pipeline Jobs & Stages

When an MR or commit is pushed, GitLab CI triggers the following pipeline jobs:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DRUPAL GITLAB CI STAGES                         │
├──────────────────┬─────────────────┬──────────────────┬────────────────┤
│ 1. Validate      │ 2. Lint         │ 3. Static Anal.  │ 4. Test Matrix │
├──────────────────┼─────────────────┼──────────────────┼────────────────┤
│ • composer-lint  │ • phpcs (Coder) │ • phpstan        │ • phpunit 10.x │
│ • cspell         │ • eslint        │   (drupal level) │ • phpunit 11.x │
│                  │ • stylelint     │                  │ • (MySQL/PgSQL)│
└──────────────────┴─────────────────┴──────────────────┴────────────────┘
```

---

## 4. Troubleshooting Common Pipeline Failures

### 1. `composer-lint` Fails
- **Symptom**: `composer validate` reports schema errors or non-normalized composer files.
- **Fix**: Run `composer validate --strict` locally. Ensure `"license": "GPL-2.0-or-later"` and `"name": "drupal/<module>"` are properly formatted.

### 2. `phpcs` Fails
- **Symptom**: Code style errors detected in PHP files.
- **Fix**: Run `vendor/bin/phpcbf --standard=Drupal,DrupalPractice .` locally to auto-fix whitespace, indentation, and docblocks.

### 3. `phpstan` Fails
- **Symptom**: Type mismatch, calling deprecated methods, or missing entity existence check.
- **Fix**: Add explicit types, check `$container->has('...')`, and ensure entity queries have `->accessCheck(TRUE)`.

### 4. `cspell` Fails
- **Symptom**: Unknown words flagged in code, tests, or documentation.
- **Fix**: Either correct the spelling typo or add legitimate domain-specific words to a project CSpell configuration file (`.cspell.json`):
  ```json
  {
    "words": [
      "drupalcode",
      "interdiff",
      "ddev"
    ]
  }
  ```

### 5. `phpunit` Fails with Strict Config Schema Error
- **Symptom**: `Drupal\Core\Config\Schema\SchemaIncompleteException: Schema errors for <config_name>`.
- **Fix**: Every module configuration object must have a matching schema definition in `config/schema/<module>.schema.yml`. Run `ddev drush config:inspect --only-error` locally.

---

## 5. Adding Custom Pre-requisite Packages or Repositories

If your module requires third-party Composer packages or custom repositories during CI runs, add a `composer:before_script` or `COMPOSER_EXTRA_REPOSITORIES` block in your `.gitlab-ci.yml`:

```yaml
variables:
  COMPOSER_EXTRA_REPOSITORIES: '[{"type": "composer", "url": "https://packages.drupal.org/8"}]'
```
