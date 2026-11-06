#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ApiAdapter } from './adapters/ApiAdapter.js';
import { MockAdapter } from './adapters/MockAdapter.js';
import { SubprocessAdapter } from './adapters/SubprocessAdapter.js';
import { EvaluationRunner } from './EvaluationRunner.js';
import { AgentAdapter, EvalSuiteResult } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..');

function parseArgs(args: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--baseline') {
      result.baseline = true;
    } else if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        const val = arg.slice(eqIdx + 1);
        result[key] = val;
      } else {
        result[arg.slice(2)] = true;
      }
    }
  }

  return result;
}

const flags = parseArgs(process.argv.slice(2));

if (flags.help) {
  console.log(`
Drupal Skills Evaluation Runner (TypeScript / pnpm)

Usage:
  pnpm eval [options]
  npx tsx evals/runner/cli.ts [options]

Options:
  --adapter=TYPE        Adapter type: 'mock' (default), 'api', or 'subprocess'
  --provider=NAME       LLM provider for API adapter / judge ('gemini', 'anthropic', 'openai')
  --model=NAME          Model name (e.g. 'gemini-2.5-flash', 'claude-3-5-sonnet-latest')
  --command=CMD         Subprocess command template (e.g. 'claude -p "{prompt}"')
  --skill=NAME          Filter evaluation cases by skill name
  --case=NAME           Filter evaluation by specific case name
  --trials=N            Number of trials per case (default: 1)
  --baseline            Run comparison with baseline (without skill)
  --format=FORMAT       Output format: 'markdown' (default) or 'json'
  --output=PATH         Write report to file path
  --help                Show this help message
`);
  process.exit(0);
}

const adapterType = String(flags.adapter ?? 'mock');
const provider = flags.provider ? String(flags.provider) : undefined;
const model = flags.model ? String(flags.model) : undefined;

let adapter: AgentAdapter;
if (adapterType === 'subprocess') {
  adapter = new SubprocessAdapter(flags.command ? String(flags.command) : undefined);
} else if (adapterType === 'api') {
  adapter = new ApiAdapter(provider as any, undefined, model);
} else {
  adapter = new MockAdapter();
}

const runner = new EvaluationRunner(repoRoot, adapter);

const evalOptions = {
  skill: flags.skill ? String(flags.skill) : undefined,
  case: flags.case ? String(flags.case) : undefined,
  trials: flags.trials ? Number(flags.trials) : 1,
  baseline: Boolean(flags.baseline),
};

console.log('==================================================');
console.log(' Drupal Skills Evaluation Suite');
console.log(` Adapter: ${adapter.name}`);
console.log(` Filter Skill: ${evalOptions.skill ?? 'all'}`);
console.log(` Trials: ${evalOptions.trials}`);
console.log(` Baseline comparison: ${evalOptions.baseline ? 'yes' : 'no'}`);
console.log('==================================================\n');

runner.run(evalOptions).then((results) => {
  const format = String(flags.format ?? 'markdown');
  const report =
    format === 'json'
      ? JSON.stringify(results, null, 2)
      : formatMarkdownReport(results);

  if (flags.output) {
    fs.writeFileSync(String(flags.output), report);
    console.log(`Report written to: ${flags.output}`);
  } else {
    console.log(report);
  }

  const allPassed =
    results.summary.executablePassed === results.summary.totalEvaluations;
  process.exit(allPassed ? 0 : 1);
});

function formatMarkdownReport(results: EvalSuiteResult): string {
  let md = '# Drupal Skills Evaluation Report\n\n';
  md += `**Date:** ${results.timestamp}  \n`;
  md += `**Adapter:** \`${results.adapter}\`  \n`;
  md += `**Total Cases:** ${results.totalCases}  \n`;
  md += `**Average Rubric Score:** ${results.summary.averageScore} / 100  \n`;
  md += `**Executable Checks Pass Rate:** ${results.summary.executablePassed} / ${results.summary.totalEvaluations}\n\n`;

  md += '## Case Breakdown\n\n';
  md += '| Skill | Case | Condition | Executable Checks | Rubric Score | Duration |\n';
  md += '| :--- | :--- | :--- | :--- | :--- | :--- |\n';

  for (const c of results.cases) {
    for (const t of c.trials) {
      const execStatus = t.executable.passed ? '✅ Passed' : '❌ Failed';
      const score = `${t.rubric.normalizedScore} / 100`;
      const duration = `${t.duration}s`;
      const totalChecks = t.executable.passedCount + t.executable.failedCount;
      md += `| \`${c.skill}\` | \`${c.name}\` | \`${t.condition}\` | ${execStatus} (${t.executable.passedCount}/${totalChecks}) | ${score} | ${duration} |\n`;
    }
  }

  md += '\n## Rubric Breakdown by Dimension\n\n';
  for (const c of results.cases) {
    md += `### Case: \`${c.name}\` (${c.skill})\n`;
    for (const t of c.trials) {
      md += `- **Condition:** \`${t.condition}\` (Trial ${t.trial})\n`;
      md += `  - **Score:** ${t.rubric.normalizedScore} / 100\n`;
      for (const [dimKey, dim] of Object.entries(t.rubric.dimensions)) {
        md += `  - **${dimKey}:** ${dim.score}/${dim.max} — ${dim.comment}\n`;
      }
    }
    md += '\n';
  }

  return md;
}
