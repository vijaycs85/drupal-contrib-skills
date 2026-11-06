---
name: drupal-solution-api-reference
description: "Choose and implement Drupal solutions using the target project's capabilities, dependency versions, and verified source patterns. Use when assessing requirements, deciding between configuration and code, or implementing, debugging, or reviewing Drupal modules, themes, profiles, recipes, and integrations. Identify the relevant core or contributed ecosystem and follow its extension contracts through dependencies as needed."
---

# Drupal Solution and API Reference

This skill guides discovering, selecting, and implementing Drupal solutions by inspecting actual project architecture, dependency versions, and verified source code patterns rather than guessing APIs or defaulting to bespoke custom code.

---

## 1. Requirement Assessment First

Before writing code or installing modules, understand the true requirement and evaluate the existing target environment:

### Step 1: Translate Domain Needs to Technical Capabilities
- Translate the user's business/domain language into Drupal technical capabilities and verifiable acceptance criteria.
- Distinguish **essential requirements** (e.g. access control, strict data models, compliance) from **optional enhancements** (e.g. UX conveniences, cosmetic defaults).

### Step 2: Inspect Target Project Context
Never assume a standard web root, directory structure, or installed module baseline.
- **Project Structure**: Check `composer.json`, `composer.lock`, and root directories (`web/`, `docroot/`, or repository root).
- **Installed Extensions & Versions**: Read `composer.lock` to verify actual locked versions of Drupal Core and key contrib modules. Do not infer dependency API signatures solely from the Drupal major version.
- **Active Configuration**: Check project configuration directories (`config/sync`, `sites/default/files/config_*`, or module config schemas).

### Step 3: Configuration and Composition Over New Modules
- Check if the requirement is already met by core features or an installed ecosystem (e.g. Field API, Views, EventDispatcher, Form API, Workflows).
- A new custom module is **not** the default outcome. First determine if configuration, extending an existing plugin, implementing an event subscriber/hook, or a Drupal Recipe satisfies the requirement.

### Step 4: Proportionate Ecosystem Evaluation
If an uninstalled ecosystem appears beneficial:
- Assess requirement fit, compatibility with locked dependencies, maintenance status, security coverage, and project constraints.
- If investigating an external candidate, inspect version-matched authoritative sources (e.g. `composer.json` requirements, Drupal.org project page, Git repository).
- **Rule**: Do not add dependencies to `composer.json` merely to investigate or browse them. Clearly distinguish a candidate proposal from a verified, installed capability.

---

## 2. Follow Relevant API Ownership

Identify the component that owns the extension point and ground implementations in its actual interfaces and contracts.

### Step 1: Pinpoint the Owning Component
- Identify which core subsystem or contributed module owns the capability (e.g. Search API, Webform, ECA, Media, Commerce, Core Block/Entity API).
- If Drupal Core is the only relevant layer, interact with Core directly without introducing middle layers.

### Step 2: Read Actual Contracts and Source
Ground implementation in real source code:
- **Interfaces & Base Classes**: Check `@api` tags, public methods, and abstract definitions in `src/`.
- **Plugin Annotations & Attributes**: In Drupal 10.2+ and Drupal 11+, check whether plugins and hooks use PHP 8 attributes (e.g. `#[Block]`, `#[Hook]`) or legacy annotations (`@Block`).
- **Service Container & Dependencies**: Inspect `*.services.yml` for service IDs, arguments, parent services, and tags (`event_subscriber`, `twig.extension`, etc.).
- **Existing Tests & Examples**: Inspect existing unit, kernel, or functional tests in the module's `tests/` directory to observe maintained usage patterns.

### Step 3: Follow Extension Chains Proportionately
- When an extension delegates to or inherits from another ecosystem, inspect the nearest applicable supported extension point.
- Do not blindly traverse entire dependency trees—only follow the contracts directly relevant to the task.
- Proximity never overrides compatibility: an inherited class from a nearby module must yield to core deprecation warnings and type signatures.

### Step 4: Handle Missing Source or Incomplete Environments
- If a package is locked in `composer.lock` but source is absent (e.g. missing `vendor/` or contrib directories) and offline:
  - Explicitly report this environment constraint.
  - State assumptions clearly and provide pattern references based on verified public documentation.
  - **Never invent** class names, service IDs, method signatures, or false verification claims.

---

## 3. Preserving Drupal Semantics

Any selected solution must respect Drupal's architectural standards:

1. **Dependency Injection**: Use DI in services, controllers, plugins (`ContainerFactoryPluginInterface`), and forms. Avoid `\Drupal::service()` in object-oriented code unless in static factory fallbacks or legacy procedural hooks.
2. **Access Control**: Always enforce entity and routing access checks (`->access('view')`, `accessCheck(TRUE)` on entity queries).
3. **Caching & Invalidation**: Attach proper cache tags (`['node:123']`), contexts (`['user.permissions']`), and max-age when returning render arrays or cacheable responses.
4. **Configuration Schema**: Define complete `config/schema/*.schema.yml` for any new configuration entities or module settings.
5. **Localization**: Wrap user-facing strings in `$this->t()` or `t()`, and use format plural for countable terms.

---

## 4. Response & Reporting Standard

When providing a solution, keep explanations concise, focused, and evidence-based:

1. **Detected Environment**: State detected Core version and relevant installed extension versions once.
2. **Selected Approach**: Briefly explain why this approach was chosen (e.g. extending an installed module's plugin vs creating a custom recipe vs core service).
3. **Verified Pattern References**: Cite the specific interface, class, or service contract inspected (`file:///` link or namespace).
4. **Changes Made**: Summarize modified files and configuration additions.
5. **Verification & Limitations**: Report tests or lint checks actually executed. Never claim tests ran or passed if the environment did not permit running them.
