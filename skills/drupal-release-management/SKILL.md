---
name: drupal-release-management
description: "Manage semantic versioning releases, release branches, Git tags, release notes, and Drupal.org release nodes for contributed modules, themes, and recipes. Includes procedures for routine bugfix/feature releases and coordinated security advisory releases with the Drupal Security Team."
---

# Drupal Release Management & Versioning

This skill guides project maintainers through creating and publishing official releases on Drupal.org, structuring Git tags according to Semantic Versioning (SemVer), drafting structured release notes, and coordinating security releases.

---

## 1. Semantic Versioning (SemVer) Conventions

Drupal contrib projects use standard Semantic Versioning (`MAJOR.MINOR.PATCH`):

| Release Type | Tag Pattern | Purpose & Impact |
| :--- | :--- | :--- |
| **Stable Patch** | `1.0.1`, `1.0.2` | Backward-compatible bug fixes and minor non-breaking improvements. |
| **Stable Minor** | `1.1.0`, `1.2.0` | New backward-compatible features and APIs. |
| **Stable Major** | `2.0.0`, `3.0.0` | Breaking changes, major architectural refactoring, or dropping legacy core support. |
| **Pre-release** | `1.0.0-alpha1`, `1.0.0-beta1`, `1.0.0-rc1` | Testing and stabilization releases before a stable release. |

> [!IMPORTANT]
> Do NOT prefix Git tags with `v` (e.g., use `1.0.0`, not `v1.0.0`). Drupal.org release packaging expects the raw semantic version number.

---

## 2. Release Branch Strategy

Maintain active branches mapped to your major/minor series:
- **`1.0.x`**: Active development and bugfix branch for the 1.0 series.
- **`1.1.x`**: Active development for the upcoming 1.1 feature release.
- **`2.0.x`**: Active development for the next major release.

### Preparing the Release Branch
1. Ensure all intended GitLab Merge Requests are merged.
2. Confirm the GitLab CI pipeline is completely green on the branch.
3. Update `CHANGELOG.md` or release notes documentation if maintained in the repo.

---

## 3. Creating and Pushing the Git Tag

Tag the commit directly on your branch:

```bash
# Checkout the branch to release
git checkout 1.0.x
git pull origin 1.0.x

# Create an annotated tag
git tag -a 1.0.1 -m "Release 1.0.1"

# Push the tag to git.drupalcode.org
git push origin 1.0.1
```

Once pushed, GitLab triggers a tag build, and Drupal.org detects the tag to allow release node creation.

---

## 4. Publishing the Release Node on Drupal.org

1. Navigate to:  
   `https://www.drupal.org/node/add/project-release/<project_nid>`  
   *(Or click "Add new release" from your project's dashboard).*
2. **Select the Tag**: Choose the tag you just pushed (e.g. `1.0.1`).
3. **Release Title**: Automatically populated from the tag name (`1.0.1`).
4. **Release Notes**: Structure the notes according to community standards.

### Release Notes Markdown Template
```markdown
### Summary of Changes in 1.0.1

This maintenance release fixes critical caching issues and adds compatibility for Drupal 11.

### Bug Fixes
- #3489120 by alice, bob: Fixed caching invalidation on entity update.
- #3489240 by charlie: Resolved undefined array key notice in block render.

### Features & Improvements
- #3489300 by david: Added configurable timeout in settings form.

### Upgrade Notes
No breaking changes. Clear Drupal caches after upgrading:
`drush cr`

### Contributors
Thanks to alice, bob, charlie, and david for their contributions to this release!
```

5. Click **Save**. Drupal.org packaging scripts will build the release archive and make it available for `composer require drupal/<project>:^1.0.1`.

---

## 5. Security Advisory Releases (Coordinated Disclosures)

If a security vulnerability is identified in a covered project:

1. **Private Handling**:
   - Never discuss the vulnerability in public issue queues or open merge requests.
   - The Drupal Security Team opens a private security issue at `https://security.drupal.org`.
2. **Private Development**:
   - Maintainers and security team members develop and review the patch on private GitLab security forks.
3. **Coordinated Release Windows**:
   - Contrib security releases are published on **Wednesdays between 12:00 and 17:00 UTC**.
   - Maintainers coordinate with the Security Team to determine the target Wednesday date.
4. **Release Execution**:
   - The Security Team grants permission to push the fix to the public repository.
   - Maintainer pushes the tag (e.g., `1.0.2` or `2.0.1`) and creates the release node, checking the **"Security release"** checkbox.
   - The Drupal Security Team publishes the official Security Advisory (DSA-YYYY-NNN) simultaneously.
