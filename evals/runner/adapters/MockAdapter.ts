import { AgentAdapter, AgentExecutionResult } from '../types.js';

export class MockAdapter implements AgentAdapter {
  name = 'mock';

  async execute(
    _prompt: string,
    _workspaceDir: string,
    _skills: Record<string, string>,
    options?: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const caseName = String(options?.case ?? '');
    const condition = String(options?.condition ?? 'with-skill');

    let output = 'Completed Drupal task following verified contracts.';

    if (condition === 'baseline-no-skill') {
      output = 'I suggest implementing a custom module with custom database schema and custom controller.';
    } else {
      switch (caseName) {
        case 'capability-discovery':
          output =
            'Detected Drupal 10.3 and drupal/webform 6.2 in composer.lock. Recommended solution: Reuse the existing Webform wizard and conditional state handlers instead of building a new custom module. Webform handles all multi-step and conditional dependencies natively.';
          break;
        case 'dependency-layers':
          output =
            'Detected drupal/webform in composer.lock. Implemented custom WebformHandler plugin extending \\Drupal\\webform\\Plugin\\WebformHandlerBase using ContainerFactoryPluginInterface to inject the logger service.\n```filepath:src/Plugin/WebformHandler/SubmissionLoggerHandler.php\n<?php\ndeclare(strict_types=1);\nnamespace Drupal\\custom_form\\Plugin\\WebformHandler;\nuse Drupal\\webform\\Plugin\\WebformHandlerBase;\nclass SubmissionLoggerHandler extends WebformHandlerBase {}\n```';
          break;
        case 'core-only':
          output =
            'Detected clean Drupal 10.3 Core environment. Implemented route access checker using Drupal\\Core\\Routing\\Access\\AccessInterface and Drupal\\Core\\Access\\AccessResult::allowedIfHasPermission() without introducing unneeded contrib dependencies.';
          break;
        case 'version-mismatch':
          output =
            'Version discrepancy identified: composer.lock specifies drupal/sample_pkg at 2.0.0, but local filesystem at web/modules/contrib/sample_pkg/sample_pkg.info.yml is at version 1.0.0. Refraining from using v2 methods until dependencies are synchronized via composer install.';
          break;
        case 'defective-change':
          output =
            'Code review for patches/defective-discount.patch: The proposed change changes calculation from total / (1 + rate) to total / rate. This is mathematically incorrect and causes fatal division by zero when rate is 0. Status: Needs work. Note: Static review; automated test suite was not run.';
          break;
        case 'clean-change':
          output =
            'Code review for patches/clean-discount.patch: The patch cleanly handles rate=0.0 by returning total, preserving standard calculation for positive rates. Logic is sound. Status: Needs review / RTBC pending CI verification. Note: Static review; automated test runner was not executed.';
          break;
      }
    }

    return {
      outputText: output,
      exitCode: 0,
      modifiedFiles: [],
      diff: '',
      durationSeconds: 0.02,
      rawOutput: output,
    };
  }
}
