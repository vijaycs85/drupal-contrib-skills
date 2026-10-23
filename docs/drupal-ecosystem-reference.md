# Drupal Contribution Ecosystem Reference & Policy Guide

This guide serves as the canonical knowledge base for the `drupal-contrib-skills` repository. It documents official Drupal.org policies, git.drupalcode.org workflows, and technical expectations across the Drupal contribution lifecycle.

---

## 1. Project Naming & Namespaces

- **Machine Name**:
  - Must consist strictly of lowercase ASCII letters, numbers, and underscores: `^[a-z0-9_]+$`.
  - Must not begin with a number or contain hyphens, spaces, or uppercase letters.
  - **Prohibited prefixes**: Projects must NOT prefix their machine name with `drupal_` or `drupal-` (e.g., use `commerce_stripe`, not `drupal_commerce_stripe`).
- **Composer Package Name**:
  - Automatically mapped as `drupal/<machine_name>`.
  - Defined in `composer.json` under `"name": "drupal/<machine_name>"`.
- **Namespace Reservation**:
  - Project namespaces are claimed when creating the project on Drupal.org (`/project/add`).
  - Sandboxes can be promoted to full projects once initial code is pushed.

---

## 2. Mandatory Project Boilerplate

Every Drupal module, theme, or recipe must provide these standard files:

| File | Purpose & Requirements |
| :--- | :--- |
| `<machine_name>.info.yml` | Project metadata, `name`, `type`, `description`, `core_version_requirement: ^10.3 \|\| ^11`. |
| `composer.json` | `type: "drupal-module"` (or `drupal-theme`, `drupal-recipe`), `license: "GPL-2.0-or-later"`. |
| `LICENSE.txt` | Must be strictly GPL-2.0-or-later. Drupal.org does not accept GPL-3.0-only or proprietary licenses for PHP code. |
| `README.md` | Standard 7-section Drupal format (Introduction, Requirements, Recommended modules, Installation, Configuration, Troubleshooting, Maintainers). |
| `.gitlab-ci.yml` | Includes official Drupal Association templates (`include.drupalci.main.yml`). |
| `.gitattributes` | Configures line endings (`* text=auto eol=lf`) and excludes dev files from export archives. |
| `.editorconfig` | Sets 2-space indentation, UTF-8 charset, and trimming of trailing whitespace. |

---

## 3. Issue Queues & Credit Attribution

Drupal is actively transitioning from legacy Drupal.org node queues to native GitLab issues:

### Dual-Mode Queues
1. **Legacy Node Queues (`drupal.org/project/issues/<project>`)**:
   - Issue lifecycle: `Active` → `Needs work` → `Needs review` → `Reviewed & tested by the community (RTBC)` → `Fixed` → `Closed (fixed)`.
   - Issue forks: `git@git.drupal.org:issue/<project>-<nid>.git`.
   - Issue branches: `<nid>-<short-description>`.
   - Credit is granted on the Drupal.org node issue page using the **Contribution Records** form.
2. **Native GitLab Issues (`git.drupalcode.org/project/<project>/-/issues`)**:
   - Issue boards, labels, milestones, threaded discussions, and direct branch MRs.
   - Closed automatically via MR commits using `Closes #<issue_id>`.

### Conventional Commits with `By:` Trailers (2025+)
Drupal core and modern contrib adopt Conventional Commits. Credit in the Git log is assigned with `By:` trailers:
```text
fix: #3456789 Fix entity canonical path access bypass
By: alice
By: bob
```

---

## 4. Security Advisory (SA) Coverage Opt-in

- **Default Status**: Newly created projects display: *"This project is not covered by Drupal's security advisory policy."*
- **Opt-in Scope**: Security coverage opt-in is **user-based**. Once an individual Drupal.org user passes security review, they can opt-in any current or future project they maintain.
- **Application Process**:
  1. File an issue in the **Drupal.org security advisory coverage applications** queue.
  2. Title: `[Branch Name] Project Name` (e.g. `[1.0.x] My Project`).
  3. Category: `Task`, Status: `Needs review`.
  4. Ensure 0 PHPCS errors, clean `composer.json`, passing GitLab CI, and substantial functional PHP code.
  5. Audit for:
     - SQL Injection: Use parameterized queries / Entity Queries.
     - Cross-Site Scripting (XSS): Use Twig auto-escaping or `Html::escape()`.
     - CSRF: Protect mutating routes with form tokens or CSRF requirements.
     - Access Checks: Explicitly include `->accessCheck(TRUE)` on all entity queries.
  6. Upon approval, edit the project node on Drupal.org and check *"Opt in to security advisory coverage"*.

---

## 5. Project Governance & Abandoned Project Takeover

When a project is abandoned:
1. **Contribute First**: Open MRs, review existing issues, demonstrate commitment.
2. **Open Local Issue**: Post a `Support request` in the project queue titled `Offering to maintain [Project Name]`.
3. **Mandatory 14-Day Waiting Period**: Wait at least 14 days for the current maintainer to reply or grant access.
4. **Escalate to Project Ownership Queue**: If no response after 14 days, move or link the issue to the **Drupal.org Project Ownership queue** (`drupal.org/project/issues/project_ownership`).
5. Drupal site moderators assess the maintainer's inactivity and the claimant's contributions, then transfer ownership or assign co-maintainer roles.

---

## 6. Release Management & Versioning

- **Branches**: Semantic branch names (`1.0.x`, `1.1.x`, `2.0.x`).
- **Tags**: Semantic versioning tags (`1.0.0`, `1.0.1`, `1.1.0-alpha1`). Do not use leading `v`.
- **Release Nodes**: Created via `drupal.org/node/add/project-release/<project_nid>`.
- **Release Notes**: Summary of changes, issue numbers, and credited usernames.
- **Security Releases**: Managed privately with the Drupal Security Team. Code developed on private security branches and released in coordination with a Wednesday DSA announcement.

---

## 7. Drupal Recipes & Modern Theming

- **Drupal Recipes (`recipe.yml`)**:
  - Ephemeral, composable packages of configuration and dependencies (`type: "drupal-recipe"`).
  - Uses the Config Actions API (`grantPermissions`, `simpleConfigUpdate`, etc.) to mutate configuration safely.
  - Replaces locking install profiles and distributions.
- **Starterkit Themes**:
  - Generated via `php core/scripts/drupal generate-theme <name> --path themes/custom`.
  - Contributed starterkits configure copying behavior via `<theme>.starterkit.yml`.
