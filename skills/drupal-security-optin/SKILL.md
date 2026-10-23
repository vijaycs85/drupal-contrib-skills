---
name: drupal-security-optin
description: "Prepare and audit Drupal contributed modules, themes, and distributions to pass the Drupal.org Security Advisory (SA) Coverage review. Covers pre-audit security vulnerability checks (SQLi, XSS, CSRF, entity query accessCheck, permission checks), application requirements, drafting the review issue in the security_applications queue, and responding to community security reviewers."
---

# Drupal Security Advisory (SA) Coverage Opt-in Guide

By default, new Drupal contributed projects carry the warning:  
> *"This project is not covered by Drupal's security advisory policy."*

To gain security coverage—where vulnerabilities are reported privately to the Drupal Security Team, fixed under embargo, and assigned official CVE identifiers—the project maintainer must successfully pass a one-time code and security review.

---

## 1. Key Rules of Security Coverage

1. **User-Based Permission**:
   - Security coverage permission is granted to **individual user accounts**, not projects.
   - Once your Drupal.org account is vetted and approved, you can opt in **any** future or existing project you maintain without needing another review.
2. **Account Requirements**:
   - You must apply from an **individual, non-shared Drupal.org account**. Corporate or shared team accounts are ineligible for git commit rights and security opt-in.
   - You can only have **one** open security application at any time.
3. **Repository Requirements**:
   - The project repository must be hosted on `git.drupalcode.org`.
   - GitLab CI must be enabled and passing cleanly.
   - `composer.json` must pass `composer validate`.
   - The codebase must be strictly licensed under `GPL-2.0-or-later`.
   - There must be substantial functional PHP code (small boilerplate or pure CSS/config modules are not accepted for vetting).

---

## 2. Pre-Audit Security Checklist

Run this comprehensive checklist before filing your application:

### A. SQL Injection Prevention
- [x] All database queries use the Database API with parameter binding (`$connection->query('... WHERE id = :id', [':id' => $val])`).
- [x] Never concatenate variables or user inputs directly into SQL strings.
- [x] Use Entity Queries instead of raw SQL whenever querying content or configuration entities.

### B. Entity Query Access Checks
- [x] **Every** entity query explicitly defines `->accessCheck(TRUE)` or `->accessCheck(FALSE)`:
  ```php
  // Explicit access check (mandatory in Drupal 10/11)
  $ids = \Drupal::entityQuery('node')
    ->accessCheck(TRUE)
    ->condition('status', 1)
    ->execute();
  ```
  *Note: Omitting `accessCheck()` throws an error in modern Drupal.*

### C. Cross-Site Scripting (XSS) Prevention
- [x] All HTML output passes through Twig templates (auto-escaped) or Render Arrays.
- [x] Dynamic user-supplied text uses `Html::escape()` or `TranslatableMarkup` with `%variable` (escaped) or `@variable` (escaped plain text).
- [x] Never use `t()` with string concatenation or direct raw user input.
- [x] Avoid raw HTML strings in controller responses; return structured render arrays.

### D. CSRF & Form Security
- [x] State-changing actions (deletions, toggles, updates) are handled via POST forms with CSRF tokens or controller routes with `_csrf_token: 'TRUE'` in routing requirements.
- [x] Forms utilize the Drupal Form API (`FormInterface`), which enforces CSRF tokens automatically.

### E. Permission & Route Access
- [x] Every route in `<module>.routing.yml` specifies explicit `_permission` or `_custom_access` requirements:
  ```yaml
  mymodule.settings:
    path: '/admin/config/mymodule'
    defaults:
      _form: '\Drupal\mymodule\Form\SettingsForm'
    requirements:
      _permission: 'administer mymodule'
  ```
- [x] Custom permissions are defined in `<module>.permissions.yml` with clear titles and `restrict access: true` for administrative powers.

### F. File Uploads & Input Sanitization
- [x] File uploads restrict allowed extensions using validators (`file_validate_extensions`).
- [x] Paths, external URLs, and redirect targets are validated using `UrlHelper::isExternal()` to prevent open redirect vulnerabilities.

---

## 3. Automated Pre-Flight Checks

Before submitting, run these commands inside your project or DDEV container:

```bash
# 1. Validate composer.json
composer validate --strict

# 2. Check Drupal coding standards (must have 0 errors)
vendor/bin/phpcs --standard=Drupal,DrupalPractice .

# 3. Static analysis with PHPStan
vendor/bin/phpstan analyze .

# 4. Check GitLab CI status
# Visit git.drupalcode.org/project/<module>/-/pipelines to confirm pipeline is green
```

---

## 4. Submitting the Security Application

1. Go to the **Drupal.org security advisory coverage applications queue**:  
   `https://www.drupal.org/project/issues/security_applications`
2. Click **Create a new issue**:
   - **Project**: Security Advisory Coverage Applications
   - **Title**: `[<branch_name>] <Project Name>` (e.g. `[1.0.x] Cloud Backup`)
   - **Category**: `Task`
   - **Status**: `Needs review`
   - **Component**: Default

### Application Issue Description Template
```markdown
### Project Link
https://www.drupal.org/project/my_module

### Git Repository
https://git.drupalcode.org/project/my_module

### Branch to Review
`1.0.x`

### Description of Module
A brief summary of what the module does and why it was created.

### Self-Audit Completed
- [x] GitLab CI pipeline is passing.
- [x] `composer validate` passes cleanly with no warnings.
- [x] PHPCS passes with 0 errors against `Drupal` and `DrupalPractice`.
- [x] PHPStan static analysis passes.
- [x] All entity queries have explicit `accessCheck()`.
- [x] Output is properly sanitized against XSS.
- [x] Routes and permissions are verified.
- [x] Licensed under GPL-2.0-or-later.
```

---

## 5. Review Phase & Activating Coverage

1. **Responding to Feedback**:
   - Community security reviewers will test the module and comment with any security or architecture questions.
   - Commit fixes directly to your application branch and comment on the issue explaining your changes.
   - Keep status as `Needs review`.
2. **Approval**:
   - Once approved, the issue is marked `Fixed`.
   - Your Drupal.org user profile is automatically granted the permission to opt-in projects.
3. **Opting In Your Project**:
   - Go to `https://www.drupal.org/project/<machine_name>/edit`.
   - Under the project settings, check **"Opt in to security advisory coverage"**.
   - Save. Your project now displays covered releases with official Security Advisory protection!
