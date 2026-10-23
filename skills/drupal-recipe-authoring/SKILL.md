---
name: drupal-recipe-authoring
description: "Authoring, testing, and distributing Drupal Recipes (introduced in Drupal 10.3 and standardized in Drupal 11+). Covers creating recipe.yml, chaining parent recipes, installing modules, managing configuration imports, executing Config Actions API mutations, bundling demo content, and testing recipes via Drush."
---

# Drupal Recipe Authoring & Testing

A **Drupal Recipe** is a composable package of configuration, module dependencies, and automated configuration actions defined primarily by a `recipe.yml` file. Recipes are **ephemeral and non-locking**—unlike traditional install profiles or distributions, once applied, a recipe executes its mutations and steps out of the way, leaving standard site configuration.

---

## 1. Directory Structure of a Recipe

A Drupal recipe lives in its own folder and follows this layout:

```text
my_recipe/
├── composer.json            # Required for packaging (type: drupal-recipe)
├── recipe.yml               # Core recipe definition file
├── config/                  # Static configuration files to import
│   └── node.type.article.yml
└── content/                 # Optional demo/seed content
    └── taxonomy_term/
        └── tags.yml
```

---

## 2. Anatomy of `recipe.yml`

```yaml
name: 'Content Publishing Workflow'
description: 'Sets up article content type, editorial workflow, and reviewer roles.'
type: 'Workflow'

# 1. Composable Recipes: Parent recipes that must execute before this one
recipes:
  - core/recipes/user_roles_base

# 2. Module / Theme Dependencies: Automatically enabled if not active
install:
  - node
  - workflows
  - content_moderation
  - media

# 3. Configuration Management Block
config:
  # Import static config files from core/contrib modules or local /config folder
  import:
    node:
      - node.type.article
    content_moderation: '*'

  # Config Actions API: Safely mutate existing configuration objects
  actions:
    user.role.content_editor:
      grantPermissions:
        - 'create article content'
        - 'edit any article content'
        - 'use editorial transition publish'

    system.site:
      simpleConfigUpdate:
        page.front: '/node'
```

---

## 3. Key `recipe.yml` Directives Explained

### `recipes:` (Composability)
Recipes can depend on other recipes. When executed, Drupal discovers and applies all dependencies in sequential order. You can reference core recipes (e.g. `core/recipes/standard`) or contributed recipes installed in `/recipes`.

### `install:`
Lists Drupal modules and themes. Drupal validates dependencies and installs any missing extensions before configuration actions run.

### `config.import:`
Imports default configuration from installed modules or the recipe's local `/config` directory:
- Specific items: `module_name: [config.name.one, config.name.two]`
- Wildcard import: `module_name: '*'` (imports all default config provided by that module).

### `config.actions:` (The Config Actions API)
Config actions allow safe, idempotent modifications to existing configuration entities without overwriting whole objects:
- **`grantPermissions`**: Grants an array of permissions to a `user.role.*` entity.
- **`revokePermissions`**: Revokes permissions from a role.
- **`simpleConfigUpdate`**: Merges key-value changes into simple configuration objects.
- **`set`**: Sets a specific property path on a config entity.

---

## 4. `composer.json` for Recipes

Recipes distributed via Packagist or Drupal.org must declare `"type": "drupal-recipe"`:

```json
{
    "name": "drupal/content_publishing_recipe",
    "type": "drupal-recipe",
    "description": "Sets up article content type, editorial workflow, and reviewer roles.",
    "license": "GPL-2.0-or-later",
    "require": {
        "drupal/core": "^10.3 || ^11"
    }
}
```

---

## 5. Adding Demo / Seed Content

Recipes can ship default content using YAML files placed inside `content/<entity_type>/`:

Example: `content/taxonomy_term/categories.yml`
```yaml
- _meta:
    version: '1.0'
    entity_type: taxonomy_term
    uuid: 4c3d82a4-1234-4567-89ab-cdef01234567
    default_langcode: en
  vid:
    - target_id: categories
  name:
    - value: 'News'
```

---

## 6. Testing & Applying Recipes

Test recipe application locally using Drush:

```bash
# Apply recipe directly from directory
ddev drush recipe /path/to/my_recipe

# Test idempotency (applying a second time should not throw errors or duplicate config)
ddev drush recipe /path/to/my_recipe

# Export and review the generated configuration diff
ddev drush config:status
ddev drush config:diff
```

### Automated Recipe Testing in PHPUnit:
Drupal core provides `RecipeTestTrait` for functional recipe verification:
```php
namespace Drupal\Tests\my_recipe\Functional;

use Drupal\FunctionalTests\Core\Recipe\RecipeTestTrait;
use Drupal\Tests\BrowserTestBase;

class MyRecipeTest extends BrowserTestBase {

  use RecipeTestTrait;

  protected $defaultTheme = 'stark';

  public function testRecipeApplication(): void {
    $this->applyRecipe('my_recipe');
    $this->assertSession()->statusCodeEquals(200);
  }

}
```
