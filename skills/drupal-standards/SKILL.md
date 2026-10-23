---
name: drupal-standards
description: "Enforces Drupal coding standards, architecture conventions, and static analysis guidelines. Use whenever writing, refactoring, or reviewing Drupal PHP, Twig, YAML, or JS code, running PHPCS with Drupal and DrupalPractice sniffs, running PHPStan (mglaman/phpstan-drupal), managing deprecations, implementing hooks, or configuring Dependency Injection."
---

# Drupal Coding Standards & Best Practices

Use this skill to enforce official Drupal community standards, architecture patterns, and static analysis checks across Drupal Core and Contrib codebases.

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
1. **Never suppress errors blindly**: Fix root causes (e.g., proper return type, null check, entity type existence check).
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

## 3. Dependency Injection & Service Container

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

## 4. Hook Architecture & Modern Conversions

Drupal 11.1+ introduced OOP Hook attributes (`#[Hook]`), progressively replacing procedural `hook_*()` implementations.

- Prefer Hook classes with `#[Hook('node_insert')]` or `#[Hook('form_alter')]` for modern Drupal 11+ modules.
- Preserve BC hooks in contributed modules supporting Drupal 10.x.
- Keep `.install` files clean; place schema in `hook_schema()` or `SchemaDefinition` objects and update paths in `hook_update_N()` or `hook_post_update_NAME()`.
