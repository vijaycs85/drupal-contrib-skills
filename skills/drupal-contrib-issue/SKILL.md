---
name: drupal-contrib-issue
description: "Workflow for resolving, testing, and reviewing issues in Drupal contributed modules and themes. Handles both traditional Drupal.org issue queues (drupal.org/project/<module>/issues/*) and modern native GitLab issues (git.drupalcode.org/project/<module>/-/issues/*). Use whenever managing contrib issue forks, testing contrib modules in host Drupal sites or DDEV, inspecting Drupal GitLab CI pipelines (.gitlab-ci.yml), and reviewing contrib merge requests."
---

# Drupal Contrib Issue & Review Workflow

This skill guides developing, testing, and reviewing issues across Drupal contributed modules and themes, supporting both the legacy Drupal.org issue tracker and modern native GitLab issues.

---

## 1. Dual-Mode Issue System Detection

Drupal Contrib is actively transitioning from Drupal.org's custom issue queue to native GitLab issues. First, determine which tracker the project uses:

### Check 1: Native GitLab Issues Enabled
Visit or check `https://git.drupalcode.org/project/<module>/-/issues`:
- If issues are open and tracked on GitLab:
  - Issues are referenced as `git.drupalcode.org/project/<module>/-/issues/<issue_id>`.
  - Development branches and MRs are managed directly within the GitLab project or user forks.
  - Reviews and comments happen as GitLab MR comments and discussions.

### Check 2: Traditional Drupal.org Issue Queue
Visit `https://www.drupal.org/project/issues/<module>`:
- If issues are tracked on Drupal.org:
  - Issue forks follow: `git@git.drupal.org:issue/<module>-<nid>.git`.
  - Issue branches follow: `<nid>-<short-description>`.
  - Issue status lifecycle (*Active*, *Needs work*, *Needs review*, *RTBC*) and credits are tracked on Drupal.org node comments.

---

## 2. Git Setup for Contrib Projects

### Cloning the Project
```bash
git clone git@git.drupalcode.org:project/<module>.git
cd <module>
```

### Adding an Issue Fork Remote (Drupal.org Mode)
```bash
# Add issue fork remote
git remote add <module>-<nid> git@git.drupal.org:issue/<module>-<nid>.git
git fetch <module>-<nid>

# Checkout the issue branch
git checkout -b <branch_name> <module>-<nid>/<branch_name>
```

### Native GitLab Fork Mode
```bash
# Fork project on git.drupalcode.org and add remote
git remote add fork git@git.drupalcode.org:<username>/<module>.git
git checkout -b <issue_id>-<short-description>
```

---

## 3. Testing Contributed Modules

Unlike Drupal Core, contrib modules do not include the full Drupal kernel and require a host Drupal environment or container.

### Method A: Testing Inside a Local DDEV Drupal Site
Symlink or place the module in `web/modules/contrib/<module>` of a local Drupal site:
```bash
# Run unit & kernel tests from host root
ddev exec "SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c web/core web/modules/contrib/<module>/tests"

# Run functional tests
ddev exec "SIMPLETEST_BASE_URL=http://localhost SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c web/core web/modules/contrib/<module>/tests/src/Functional"
```

### Method B: Drupal GitLab CI (.gitlab-ci.yml)
Drupal Contrib projects use centralized GitLab CI templates:
1. Check `.gitlab-ci.yml` in the module root.
2. Push commits to trigger the pipeline on `git.drupalcode.org`.
3. Check pipeline status:
   - `composer-lint`
   - `phpcs`
   - `phpstan`
   - `phpunit` (across multiple Drupal core and PHP matrix versions).

---

## 4. Code Standards & Deprecation Audits

Contrib modules must support the versions declared in their `composer.json` or `*.info.yml` `core_version_requirement`:
```bash
# Check coding standards
vendor/bin/phpcs --standard=Drupal,DrupalPractice --extensions=php,module,inc,install,theme,info.yml,yml web/modules/contrib/<module>

# PHPStan check
vendor/bin/phpstan analyze web/modules/contrib/<module>
```

- Verify that APIs used are supported across all claimed core versions (e.g. `^10.3 || ^11`).
- Avoid using APIs introduced only in the newest core version without conditional version checks or polyfills.

---

## 5. Review & Comment Templates

### For Drupal.org Issue Queues:
```markdown
### Review of [MR !<mr_id>](https://git.drupalcode.org/project/<module>/-/merge_requests/<mr_id>)

1. **Test Coverage**:
   - Automated tests added in `tests/src/...`.
   - All tests pass locally and in GitLab CI.

2. **Standards**:
   - `phpcs` clean with Drupal and DrupalPractice.
   - `phpstan` passes at module's configured level.

3. **Backwards Compatibility**:
   - `core_version_requirement` respected.
   - No breaking schema or API changes without update hooks.

Setting status to **Needs review** (or **Reviewed & tested by the community**).
```

### For Native GitLab Issues / Merge Requests:
Provide concise inline MR review comments directly on GitLab threads focusing on architectural soundness, performance, and security.
