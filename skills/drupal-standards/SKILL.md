---
name: drupal-standards
description: "Enforces Drupal coding standards, architecture conventions, and static analysis guidelines. Use whenever writing, refactoring, or reviewing Drupal PHP, Twig, YAML, or JS code, running PHPCS with Drupal and DrupalPractice sniffs, running PHPStan (mglaman/phpstan-drupal), managing deprecations, implementing hooks, or configuring Dependency Injection."
---

# Drupal Coding Standards & Best Practices

Use this skill to enforce official Drupal community standards, architecture patterns, configuration schema rules, and static analysis checks across Drupal Core and Contrib codebases.

---

## 1. Drupal PHP Coding Standards (PHPCS)

Drupal follows specific code formatting rules enforced by `drupal/coder` (`Drupal` and `DrupalPractice` standards).

### Key Rules
- **Indentation**: 2 spaces (no tabs).
- **Control structures**: Space after keyword, braces on same line:
  ```php
  if ($condition) {
    // ...
  }
  elseif ($other) {
    // ...
  }
  else {
    // ...
  }
  ```
- **Function/Class declarations**:
  ```php
  class ExampleService implements ExampleInterface {

    public function processItem(string $id, array $options = []): bool {
      // ...
    }

  }
  ```
- **Use statements**:
  - Alphabetically sorted.
  - Grouped together at the top of the file.
  - No unused imports.
- **Strict typing**: Always add `declare(strict_types=1);` in new PHP files and tests.
- **Type hints & Return types**: Always provide native PHP 8 type hints and return types for methods and parameters.

### Running PHPCS
```bash
# Check code style
vendor/bin/phpcs --standard=Drupal,DrupalPractice path/to/file.php

# Automatically fix violations where possible
vendor/bin/phpcbf --standard=Drupal,DrupalPractice path/to/file.php

# Within DDEV
ddev exec vendor/bin/phpcs --standard=Drupal,DrupalPractice path/to/file.php
```

---

## 2. Static Analysis & Deprecations (PHPStan)

Drupal projects use PHPStan with `mglaman/phpstan-drupal`.

### Guidelines
1. **Never suppress errors blindly**: Fix root causes (proper return types, null checks, entity type existence checks).
2. **Safe Entity Loading**:
   - Never assume entity types exist when working in installer or early bootstrap contexts.
   - Check container and definition before calling entity methods:
     ```php
     if (\Drupal::hasContainer()
       && \Drupal::hasService('entity_type.manager')
       && \Drupal::entityTypeManager()->hasDefinition('user')
       && ($user = User::load($id))) {
       // Safe to operate on $user.
     }
     ```
3. **Deprecations**:
   - When calling deprecated APIs, check Drupal change records (`https://www.drupal.org/node/<nid>`).
   - For deprecating functions/methods, use `@trigger_error()` with `E_USER_DEPRECATED` and an `@deprecated` docblock specifying the removal version.

### Running PHPStan
```bash
vendor/bin/phpstan analyze path/to/file.php

# Within DDEV
ddev exec vendor/bin/phpstan analyze path/to/file.php
```

---

## 3. Configuration Schemas & Strict Validation

All configuration saved by modules (install config, third-party settings, schema files) must be fully declared in `config/schema/<module>.schema.yml`.

### Example Schema Definition:
```yaml
mymodule.settings:
  type: config_object
  label: 'My Module Settings'
  mapping:
    api_key:
      type: string
      label: 'API Key'
    timeout:
      type: integer
      label: 'Request Timeout'
```

### Strict Schema Checking in Tests:
Drupal test runs enable `$strictConfigSchema = TRUE` by default. Any test that saves configuration without a valid schema definition will fail. Always verify schemas:
```bash
ddev drush config:inspect --only-error
```

---

## 4. Modern Plugin & Hook Attributes (PHP 8)

### Modern Plugin Attributes
Drupal 10.2+ and 11+ transition plugins from Doctrine annotations to native PHP 8 attributes:
```php
namespace Drupal\mymodule\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;

#[Block(
  id: "mymodule_example",
  admin_label: new TranslatableMarkup("Example Block"),
  category: new TranslatableMarkup("Custom")
)]
class ExampleBlock extends BlockBase {
  // ...
}
```

### Modern Hook Attributes
Drupal 11.1+ introduces object-oriented hook implementations using `#[Hook]`:
```php
namespace Drupal\mymodule\Hook;

use Drupal\Core\Hook\Attribute\Hook;

class NodeHooks {

  #[Hook('node_insert')]
  public function onNodeInsert(\Drupal\node\NodeInterface $node): void {
    // Logic on node insert.
  }

}
```
*Note: For modules maintaining backward compatibility with Drupal 10.x, maintain standard procedural hooks in `<module>.module`.*

---

## 5. Dependency Injection & Service Container

Drupal strictly prohibits using `\Drupal::service()` in object-oriented code where container injection is available.

- **Controllers, Forms, Plugins**:
  Implement `ContainerInjectionInterface` or use `create(ContainerInterface $container)`.
- **Services (`*.services.yml`)**:
  Declare service dependencies as arguments:
  ```yaml
  services:
    mymodule.custom_service:
      class: Drupal\mymodule\Service\CustomService
      arguments:
        - '@entity_type.manager'
        - '@config.factory'
        - '@datetime.time'
  ```
- **Procedural code (.module / .install)**:
  `\Drupal::service(...)` or `\Drupal::entityTypeManager()` is only permissible in procedural hooks, install files, or early bootstrap where DI cannot be injected.

---

## 6. Frontend Standards & Linters

Drupal projects with frontend assets (JavaScript, CSS, Twig) enforce:
- **ESLint**: Uses `eslint-config-drupal-bundle`. Modern ES6+, strict equality (`===`), no `var`.
- **Stylelint**: Uses `stylelint-config-standard`. Enforces BEM-style CSS naming and 2-space indentation.
- **CSpell**: Spell checking for comments and string literals. Add legitimate technical terms to the project's dictionary if needed.
