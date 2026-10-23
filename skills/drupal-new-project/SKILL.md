---
name: drupal-new-project
description: "Scaffolding and launching new Drupal modules, themes, starterkits, and recipes according to Drupal.org community standards. Enforces machine name rules, mandatory boilerplate files (.info.yml, composer.json, standard 7-section README.md, LICENSE.txt, .gitlab-ci.yml), Git branch conventions, and initial release preparation."
---

# Creating & Launching New Drupal Projects

This skill guides the complete process of creating, scaffolding, and publishing a new contributed module, theme, starterkit, or recipe on Drupal.org and `git.drupalcode.org`.

---

## 1. Project Naming & Namespace Rules

Before creating a project on Drupal.org:
1. **Machine Name Constraints**:
   - Must contain strictly lowercase alphanumeric characters and underscores: `^[a-z0-9_]+$`.
   - **Never** use hyphens (`-`).
   - **Never** prefix the machine name with `drupal_` or `drupal-` (e.g., use `ai_interpolator`, not `drupal_ai_interpolator`).
   - Must be unique across all modules, themes, profiles, and recipes on Drupal.org.
2. **Project URL & Namespace**:
   - Full Project URL: `https://www.drupal.org/project/<machine_name>`.
   - GitLab URL: `https://git.drupalcode.org/project/<machine_name>`.
   - Composer package name: `drupal/<machine_name>`.

---

## 2. Mandatory Project Boilerplate

Every project must have the following file structure in its root directory:

```text
my_module/
├── .editorconfig
├── .gitattributes
├── .gitlab-ci.yml
├── LICENSE.txt
├── README.md
├── composer.json
├── my_module.info.yml
├── my_module.module (or src/ for pure OOP)
└── config/schema/my_module.schema.yml (if configuration is stored)
```

### 1. `my_module.info.yml`
```yaml
name: 'My Module'
type: module
description: 'Provides functionality for...'
package: 'Custom'
core_version_requirement: '^10.3 || ^11'
# configure: my_module.settings
# dependencies:
#   - drupal:node
```

### 2. `composer.json`
```json
{
    "name": "drupal/my_module",
    "type": "drupal-module",
    "description": "Provides functionality for...",
    "license": "GPL-2.0-or-later",
    "minimum-stability": "dev",
    "require": {
        "drupal/core": "^10.3 || ^11"
    }
}
```
*Note: For themes, use `"type": "drupal-theme"`. For recipes, use `"type": "drupal-recipe"`.*

### 3. `LICENSE.txt`
Must contain the complete GNU General Public License version 2 or later (GPL-2.0-or-later). Drupal.org requires GPL-compatible licensing for all distributed PHP code.

### 4. `README.md` (Standard 7-Section Drupal Format)
```markdown
# My Module

## CONTENTS OF THIS FILE
- Introduction
- Requirements
- Recommended modules
- Installation
- Configuration
- Troubleshooting
- Maintainers

## INTRODUCTION
A concise explanation of the module's purpose and functionality.

## REQUIREMENTS
- Drupal 10.3+ or Drupal 11+
- PHP 8.2+

## RECOMMENDED MODULES
Optional complementary modules.

## INSTALLATION
Install as you would normally install a contributed Drupal module:
`composer require drupal/my_module`

## CONFIGURATION
1. Navigate to Administration > Configuration > ...
2. Configure settings as desired.

## TROUBLESHOOTING
Known issues and common resolution steps.

## MAINTAINERS
- Your Name (username) - https://www.drupal.org/u/username
```

### 5. `.gitlab-ci.yml` (Drupal Association Official Template)
```yaml
#################
# DrupalCI GitLabCI template
# Based off: https://git.drupalcode.org/project/gitlab_templates
#################

include:
  - project: $_GITLAB_TEMPLATES_REPO
    ref: $_GITLAB_TEMPLATES_REF
    file:
      - '/includes/include.drupalci.main.yml'
      - '/includes/include.drupalci.variables.yml'
      - '/includes/include.drupalci.workflows.yml'
```

### 6. `.gitattributes` & `.editorconfig`
**`.gitattributes`**:
```text
* text=auto eol=lf
*.md text
*.php text diff=php
/tests/ export-ignore
/.gitlab-ci.yml export-ignore
```

**`.editorconfig`**:
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
```

---

## 3. Git Repository Setup & Initial Branch

1. **Add Remote**:
   ```bash
   git init
   git remote add origin git@git.drupalcode.org:project/<machine_name>.git
   ```

2. **Branch Strategy**:
   - Use semantic branches (`1.0.x`, `1.1.x`, or `2.0.x`).
   ```bash
   git checkout -b 1.0.x
   git add .
   git commit -m "feat: Initial commit for my_module"
   git push -u origin 1.0.x
   ```

3. **Set Default Branch on GitLab**:
   - Navigate to `https://git.drupalcode.org/project/<machine_name>/-/settings/repository`.
   - Set default branch to `1.0.x`.

---

## 4. Theme & Starterkit Creation

When launching a theme:
- Do not sub-theme `classy` or `stable`.
- Generate via core Starterkit:
  ```bash
  php core/scripts/drupal generate-theme my_theme --path themes/custom
  ```
- If distributing a Starterkit theme for others to clone, provide `my_theme.starterkit.yml`:
  ```yaml
  ignore:
    - '*.zip'
    - 'node_modules/**'
  info:
    core_version_requirement: '^10.3 || ^11'
  ```

---

## 5. Next Steps After Launch
1. Verify that GitLab CI pipeline completes green on `git.drupalcode.org`.
2. Apply for **Security Advisory Coverage** (`drupal-security-optin`).
3. Create your first semantic version release tag (`drupal-release-management`).
