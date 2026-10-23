---
name: drupal-patch-reroll
description: "Use when auditing, fixing, or rerolling Drupal patches that fail to apply during composer install or composer update (e.g. cweagans/composer-patches errors), especially after major/minor Drupal core or module upgrades. Covers checking if patches are already committed upstream, discovering modern GitLab MR diffs on drupalcode.org, resolving reject files (.rej), generating clean -p1 patches, and updating composer.json."
---

# Drupal Patch Auditing and Rerolling

When upgrading Drupal core or contrib modules, existing patches in `composer.json` or `patches.json` often fail to apply because the upstream codebase changed or the issue was already resolved upstream.

Follow this systematic 5-step workflow to audit and reroll failing patches.

---

## 1. Identify Failing Patches & Context

When `composer install` fails with patch errors:
1. Note the failing package (e.g. `drupal/commerce`, `drupal/webform`) and the patch URL/description in `composer.json` (`extra.patches`).
2. Download or locate the patch content:
   ```bash
   curl -sL "<patch-url>" -o /tmp/failing_patch.patch
   ```
3. Test application locally to see what hunk fails:
   ```bash
   cd web/modules/contrib/<module>
   git apply --check /tmp/failing_patch.patch
   ```

---

## 2. Check If Already Committed Upstream

Often, the patch is no longer needed because the fix was merged into the new release.

1. Inspect the target files in `web/modules/contrib/<module>` or `web/core`:
   - Search for the function, class, or lines being patched.
   - Example: `grep -rn "targetMethod" web/modules/contrib/<module>/src`
2. Check the module's recent git history or changelog:
   ```bash
   cd web/modules/contrib/<module>
   git log -n 20 --grep="<issue-number>"
   ```
3. **If already resolved upstream**:
   - Remove the patch entry from `composer.json` (or `patches.json`).
   - Run `ddev composer install` to verify.

---

## 3. Search for Updated Drupal.org / GitLab MR Diffs

Before manually rerolling, check if an updated patch or active GitLab Merge Request exists:

1. Locate the Drupal.org issue from the patch filename or comment (e.g., `https://www.drupal.org/project/<module>/issues/<issue-number>`).
2. On modern Drupal.org issues, development happens on GitLab Merge Requests.
   - Direct MR diff URL format:
     `https://git.drupalcode.org/project/<project>/-/merge_requests/<mr_id>.diff`
   - Direct commit patch URL format:
     `https://git.drupalcode.org/project/<project>/-/commit/<commit_sha>.patch`
3. If an updated MR diff or latest comment patch works:
   - Update the patch URL in `composer.json`.
   - Test with `ddev composer install`.

---

## 4. Reroll the Patch Manually

If no upstream patch applies cleanly to the target version:

1. **Apply with rejects**:
   ```bash
   cd web/modules/contrib/<module>
   git checkout .
   git clean -fd
   git apply --reject /tmp/failing_patch.patch
   ```
   *Alternative if `git apply` fails completely:*
   ```bash
   patch -p1 --merge < /tmp/failing_patch.patch
   ```

2. **Inspect and resolve `.rej` files**:
   - Find any generated `.rej` files:
     ```bash
     find . -name "*.rej"
     ```
   - For each `.rej` file, view the rejected hunk and manually apply the intended logic to the corresponding source file.
   - Delete the `.rej` and `.orig` files once resolved:
     ```bash
     find . -name "*.rej" -delete
     find . -name "*.orig" -delete
     ```

3. **Verify and format the diff**:
   - Inspect the diff:
     ```bash
     git diff
     ```
   - Ensure only intended changes are included (no extraneous whitespace or formatting churn).
   - Export the clean `-p1` patch to the project's `patches/` directory:
     ```bash
     git diff > /path/to/project/patches/contrib/<module>-<issue_number>-<short_description>-<version>.patch
     ```
   - Reset the contrib directory so composer can manage it cleanly:
     ```bash
     git checkout .
     git clean -fd
     ```

---

## 5. Update `composer.json` (v1 and v2 Plugin Syntax)

Update your composer patch configuration depending on your `cweagans/composer-patches` version:

### Composer Patches v1 Format:
```json
"extra": {
    "patches": {
        "drupal/<module>": {
            "Issue #<issue-number>: <description>": "patches/contrib/<module>-<issue_number>-<description>.patch"
        }
    }
}
```

### Composer Patches v2 Format (`patches.json` or inline):
```json
"extra": {
    "patches": {
        "drupal/<module>": [
            {
                "description": "Issue #<issue-number>: <description>",
                "url": "patches/contrib/<module>-<issue_number>-<description>.patch"
            }
        ]
    }
}
```

### Verification
Run Composer to verify the rerolled patch applies cleanly:
```bash
ddev composer install
ddev drush deploy -y
```
