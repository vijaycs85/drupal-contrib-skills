---
name: drupal-contrib-issue
description: "Workflow for resolving, testing, and reviewing issues in Drupal contributed modules and themes. Handles both traditional Drupal.org issue queues (drupal.org/project/[module]/issues/*) and modern native GitLab issues (git.drupalcode.org/project/[module]/-/issues/*). Use whenever managing contrib issue forks, testing contrib modules in host Drupal sites or DDEV, inspecting Drupal GitLab CI pipelines (.gitlab-ci.yml), and reviewing contrib merge requests."
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
  - Reviews happen as GitLab MR comments and inline threaded discussions.
  - Merge commits use `Closes #<issue_id>` syntax to automatically resolve issues upon merge.

### Check 2: Traditional Drupal.org Issue Queue
Visit `https://www.drupal.org/project/issues/<module>`:
- If issues are tracked on Drupal.org:
  - Issue forks follow: `git@git.drupal.org:issue/<module>-<nid>.git`.
  - Issue branches follow: `<nid>-<short-description>`.
  - Issue status lifecycle (*Active*, *Needs work*, *Needs review*, *RTBC*, *Fixed*) and credits are tracked on Drupal.org node comments.

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

### Keeping Branches Synced
Rebase frequently against the primary branch (`1.0.x`, `1.x`, or `main`):
```bash
git fetch origin
git rebase origin/1.0.x
git push --force-with-lease <remote_name> <branch_name>
```

---

## 3. Testing Contributed Modules

### In a Host Drupal Site (DDEV)
Contributed modules are typically tested within a functional Drupal installation:

1. **Symlink or clone the module into the host site**:
   ```bash
   cd /path/to/drupal/web/modules/contrib
   # If already installed via composer, navigate to it:
   cd <module>
   ```

2. **Run Module Tests via DDEV**:
   ```bash
   # Run all PHPUnit tests for the module
   ddev exec "SIMPLETEST_DB=mysql://db:db@db/db SIMPLETEST_BASE_URL=http://localhost vendor/bin/phpunit -c web/core web/modules/contrib/<module>/tests"

   # Run a specific Unit or Kernel test
   ddev exec "SIMPLETEST_DB=mysql://db:db@db/db vendor/bin/phpunit -c web/core web/modules/contrib/<module>/tests/src/Kernel/ExampleTest.php"
   ```

3. **Check Coding Standards**:
   ```bash
   ddev exec vendor/bin/phpcs --standard=Drupal,DrupalPractice web/modules/contrib/<module>
   ```

4. **Verify PHPStan Static Analysis**:
   ```bash
   ddev exec vendor/bin/phpstan analyze web/modules/contrib/<module>
   ```

---

## 4. Contrib Commit Messages & Credit Attribution

Drupal projects use the **Conventional Commits** format with **`By:` trailers** or the traditional contrib syntax:

### Modern Conventional Commits Format:
```text
fix: #3456789 Fix array key undefined in block render
By: username1
By: username2
```

### Traditional Contrib Format:
```text
Issue #3456789 by username1, username2: Fixed array key undefined in block render
```

### Official Drupal.org Credit Allocation:
- Names in commit messages document Git history.
- **Maintainers**: When closing an issue as *Fixed* on Drupal.org, always inspect the **Contribution Records** form. Check the credit boxes for authors who provided patches, MR commits, thorough code reviews, or verified manual testing steps.

---

## 5. Reviewing Contrib Merge Requests & Posting Feedback

When reviewing community merge requests, provide thorough and reproducible feedback:

### Contrib Review Template
```markdown
### Review & Testing Report for MR !<mr_id>

1. **Manual Testing Verification**:
   - **Environment**: Drupal 10.4 / Drupal 11.1, PHP 8.3.
   - **Steps Taken**:
     1. Enabled `<module>`.
     2. Configured settings at `/admin/config/...`.
     3. Triggered scenario described in the issue summary.
   - **Outcome**: The fix resolves the issue as expected without regression.

2. **Code & Standards Audit**:
   - [x] PHPCS passed cleanly (`Drupal`, `DrupalPractice`).
   - [x] PHPStan passed with 0 errors.
   - [x] Unit/Kernel test coverage included for the bug or new feature.
   - [x] `core_version_requirement` checked in `.info.yml`.

3. **Recommendation**:
   Setting status to **Reviewed & tested by the community (RTBC)**.
```
