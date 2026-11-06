import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CaseConfig, ExecutableCheckResult, ExecutableGradingResult } from '../runner/types.js';

export class ExecutableGrader {
  grade(workspaceDir: string, criteria: CaseConfig['executable_checks'] = {}, modifiedFiles: string[] = []): ExecutableGradingResult {
    const checks: ExecutableCheckResult[] = [];
    let passedCount = 0;
    let failedCount = 0;

    // 1. file_exists
    for (const file of criteria.file_exists ?? []) {
      const fullPath = path.join(workspaceDir, file);
      const exists = fs.existsSync(fullPath);
      checks.push({
        name: `file_exists: ${file}`,
        passed: exists,
        message: exists ? `File exists: ${file}` : `Required file missing: ${file}`,
      });
      exists ? passedCount++ : failedCount++;
    }

    // 2. file_not_exists
    for (const file of criteria.file_not_exists ?? []) {
      const fullPath = path.join(workspaceDir, file);
      const absent = !fs.existsSync(fullPath);
      checks.push({
        name: `file_not_exists: ${file}`,
        passed: absent,
        message: absent ? `Forbidden file absent: ${file}` : `Forbidden file was created: ${file}`,
      });
      absent ? passedCount++ : failedCount++;
    }

    // 3. content_contains
    for (const rule of criteria.content_contains ?? []) {
      const fullPath = path.join(workspaceDir, rule.file);
      if (!fs.existsSync(fullPath)) {
        checks.push({
          name: `content_contains: ${rule.file}`,
          passed: false,
          message: `File ${rule.file} does not exist to check contents.`,
        });
        failedCount++;
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const found = rule.pattern
        ? new RegExp(rule.pattern).test(content)
        : rule.text
        ? content.includes(rule.text)
        : false;

      checks.push({
        name: `content_contains: ${rule.file}`,
        passed: found,
        message: found ? `Pattern found in ${rule.file}` : `Expected pattern not found in ${rule.file}: ${rule.pattern ?? rule.text}`,
      });
      found ? passedCount++ : failedCount++;
    }

    // 4. content_not_contains
    for (const rule of criteria.content_not_contains ?? []) {
      const fullPath = path.join(workspaceDir, rule.file);
      if (!fs.existsSync(fullPath)) {
        checks.push({
          name: `content_not_contains: ${rule.file}`,
          passed: true,
          message: `File ${rule.file} absent.`,
        });
        passedCount++;
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      const forbiddenFound = rule.pattern
        ? new RegExp(rule.pattern).test(content)
        : rule.text
        ? content.includes(rule.text)
        : false;

      checks.push({
        name: `content_not_contains: ${rule.file}`,
        passed: !forbiddenFound,
        message: !forbiddenFound ? `Forbidden content absent in ${rule.file}` : `Forbidden content found in ${rule.file}: ${rule.pattern ?? rule.text}`,
      });
      !forbiddenFound ? passedCount++ : failedCount++;
    }

    // 5. Custom command checks
    for (const cmdCheck of criteria.command_checks ?? []) {
      const expectedExitCode = cmdCheck.expected_exit_code ?? 0;
      let actualExitCode = 0;
      let output = '';

      try {
        output = execSync(cmdCheck.command, { cwd: workspaceDir, encoding: 'utf-8', stdio: 'pipe' });
      } catch (err: any) {
        actualExitCode = err.status ?? 1;
        output = err.message;
      }

      const passed = actualExitCode === expectedExitCode;
      checks.push({
        name: `command: ${cmdCheck.command}`,
        passed,
        message: passed ? `Command exited with code ${actualExitCode}` : `Command failed (exit ${actualExitCode}, expected ${expectedExitCode}): ${output}`,
      });
      passed ? passedCount++ : failedCount++;
    }

    return {
      passed: failedCount === 0,
      passedCount,
      failedCount,
      checks,
    };
  }
}
