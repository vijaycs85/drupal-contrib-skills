# Upstream Monitoring & Tracking Sources

This document lists the official feeds, repositories, and release channels used to keep the `drupal-contrib-skills` collection synchronized with the latest Drupal standards.

---

## 1. Drupal Change Records (CRs)

Drupal publishes formal change notices for all breaking changes, API additions, and deprecations:
- **Change Notices Search**: [https://www.drupal.org/list-changes](https://www.drupal.org/list-changes)
- **Drupal Core Change Records**: [https://www.drupal.org/list-changes/drupal](https://www.drupal.org/list-changes/drupal)
- **RSS Feed**: [https://www.drupal.org/node/feeds/changes](https://www.drupal.org/node/feeds/changes)

### Key Subsystems to Monitor:
- **Core Hooks**: Deprecations of procedural hooks in favor of OOP `#[Hook]` attributes.
- **Plugin System**: Deprecation of doctrine annotations in favor of PHP 8 attributes (e.g. `#[Block]`, `#[FieldType]`).
- **Configuration API**: Schema changes and strict config schema checking.
- **Routing & Access**: CSRF requirements and access checker signatures.

---

## 2. GitLab CI Templates Repository

The Drupal Association centrally maintains the GitLab CI templates for all Drupal projects:
- **GitLab Repository**: [https://git.drupalcode.org/project/gitlab_templates](https://git.drupalcode.org/project/gitlab_templates)
- **Main Include File**: `includes/include.drupalci.main.yml`
- **Variables Include**: `includes/include.drupalci.variables.yml`
- **Workflows Include**: `includes/include.drupalci.workflows.yml`

### What to Watch:
- Updates to test runners, PHP versions (PHP 8.2, 8.3, 8.4, 8.5), and database engines.
- New linters and validators (CSpell dictionary updates, ESLint bundles, PHPStan extensions).

---

## 3. Coding Standards & Static Analysis

- **Drupal Coder (PHPCS)**:
  - Repository: [https://git.drupalcode.org/project/coder](https://git.drupalcode.org/project/coder)
  - Standards: `Drupal`, `DrupalPractice`.
- **PHPStan Drupal (`mglaman/phpstan-drupal`)**:
  - GitHub: [https://github.com/mglaman/phpstan-drupal](https://github.com/mglaman/phpstan-drupal)
  - Release Notes & deprecation rule enhancements.
- **Drupal Core Coding Standards Policy**:
  - Docs: [https://www.drupal.org/docs/develop/standards](https://www.drupal.org/docs/develop/standards)
  - Commit message format: Conventional Commits with `By:` trailers.

---

## 4. Security Advisory Policies

- **Drupal Security Team Policies**: [https://www.drupal.org/drupal-security-team/security-advisory-process-and-permissions-policy](https://www.drupal.org/drupal-security-team/security-advisory-process-and-permissions-policy)
- **Security Applications Queue**: [https://www.drupal.org/project/issues/security_applications](https://www.drupal.org/project/issues/security_applications)
- **Security Best Practices Guide**: [https://www.drupal.org/docs/security-in-drupal](https://www.drupal.org/docs/security-in-drupal)

---

## 5. Automated Audit & Update Procedure

When running the `drupal-skills-updater` skill:
1. Scan latest Drupal core release notes (e.g., `https://www.drupal.org/project/drupal/releases`).
2. Query recent Change Records for deprecations affecting modules, themes, or testing.
3. Review `git.drupalcode.org/project/gitlab_templates` diffs.
4. Update affected `skills/*/SKILL.md` files.
5. Increment version in `marketplace.json` and generate an updated distribution tarball via `scripts/package.sh`.
