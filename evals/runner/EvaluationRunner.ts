import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as YAML from 'yaml';
import { ExecutableGrader } from '../graders/ExecutableGrader.js';
import { RubricGrader } from '../graders/RubricGrader.js';
import {
  AgentAdapter,
  CaseConfig,
  EvalCase,
  EvalCaseResult,
  EvalSuiteResult,
  EvalTrialResult,
} from './types.js';

export class EvaluationRunner {
  private repoRoot: string;
  private adapter: AgentAdapter;
  private executableGrader: ExecutableGrader;
  private rubricGrader: RubricGrader;

  constructor(
    repoRoot: string,
    adapter: AgentAdapter,
    executableGrader?: ExecutableGrader,
    rubricGrader?: RubricGrader
  ) {
    this.repoRoot = repoRoot;
    this.adapter = adapter;
    this.executableGrader = executableGrader ?? new ExecutableGrader();
    this.rubricGrader = rubricGrader ?? new RubricGrader();
  }

  async run(options: {
    skill?: string;
    case?: string;
    trials?: number;
    baseline?: boolean;
  } = {}): Promise<EvalSuiteResult> {
    const trialsCount = Math.max(1, options.trials ?? 1);
    const runBaseline = Boolean(options.baseline);
    const cases = this.discoverCases(options.skill, options.case);

    const suiteResult: EvalSuiteResult = {
      timestamp: new Date().toISOString(),
      adapter: this.adapter.name,
      totalCases: cases.length,
      trialsPerCase: trialsCount,
      cases: [],
      summary: {
        totalEvaluations: 0,
        executablePassed: 0,
        averageScore: 0,
      },
    };

    let totalScore = 0;
    let evalCount = 0;
    let totalTokens = 0;
    let withSkillTokens = 0;
    let withSkillCount = 0;
    let baselineTokens = 0;
    let baselineCount = 0;

    for (const testCase of cases) {
      const caseResult: EvalCaseResult = {
        name: testCase.name,
        skill: testCase.skill,
        fixture: testCase.fixture,
        trials: [],
      };

      const skillPath = path.join(this.repoRoot, 'skills', testCase.skill, 'SKILL.md');
      const skillsMap = fs.existsSync(skillPath)
        ? { [testCase.skill]: fs.readFileSync(skillPath, 'utf-8') }
        : {};

      for (let trial = 1; trial <= trialsCount; trial++) {
        // Run with skill
        const trialRes = await this.runSingleTrial(testCase, skillsMap, 'with-skill', trial);
        caseResult.trials.push(trialRes);

        evalCount++;
        if (trialRes.executable.passed) {
          suiteResult.summary.executablePassed++;
        }
        totalScore += trialRes.rubric.normalizedScore;

        if (trialRes.tokens) {
          totalTokens += trialRes.tokens.totalTokens;
          withSkillTokens += trialRes.tokens.totalTokens;
          withSkillCount++;
        }

        // Run baseline without skill if requested
        if (runBaseline) {
          const baselineRes = await this.runSingleTrial(testCase, {}, 'baseline-no-skill', trial);
          caseResult.trials.push(baselineRes);

          if (baselineRes.tokens) {
            totalTokens += baselineRes.tokens.totalTokens;
            baselineTokens += baselineRes.tokens.totalTokens;
            baselineCount++;
          }
        }
      }

      suiteResult.cases.push(caseResult);
    }

    suiteResult.summary.totalEvaluations = evalCount;
    suiteResult.summary.averageScore =
      evalCount > 0 ? Math.round((totalScore / evalCount) * 10) / 10 : 0;
    suiteResult.summary.totalTokens = totalTokens;
    suiteResult.summary.withSkillAvgTokens =
      withSkillCount > 0 ? Math.round(withSkillTokens / withSkillCount) : 0;
    suiteResult.summary.baselineAvgTokens =
      baselineCount > 0 ? Math.round(baselineTokens / baselineCount) : 0;

    return suiteResult;
  }

  private async runSingleTrial(
    testCase: EvalCase,
    skillsMap: Record<string, string>,
    condition: 'with-skill' | 'baseline-no-skill',
    trialNum: number
  ): Promise<EvalTrialResult> {
    const sandboxDir = this.createSandbox(testCase.fixture);

    try {
      const execResult = await this.adapter.execute(
        testCase.prompt,
        sandboxDir,
        skillsMap,
        { case: testCase.name, condition }
      );

      if (execResult.errorMessage) {
        return {
          trial: trialNum,
          condition,
          duration: execResult.durationSeconds,
          executable: {
            passed: false,
            passedCount: 0,
            failedCount: 1,
            checks: [{
              name: 'agent_execution',
              passed: false,
              message: execResult.errorMessage,
            }],
          },
          rubric: {
            normalizedScore: 0,
            dimensions: {},
            overallFeedback: `Execution failed: ${execResult.errorMessage}`,
          },
          modifiedFiles: [],
          errorMessage: execResult.errorMessage,
        };
      }

      const executable = this.executableGrader.grade(
        sandboxDir,
        testCase.config.executable_checks,
        execResult.modifiedFiles
      );

      const rubric = await this.rubricGrader.grade(
        testCase.prompt,
        execResult.outputText,
        execResult.diff,
        testCase.config
      );

      return {
        trial: trialNum,
        condition,
        duration: execResult.durationSeconds,
        tokens: execResult.tokens,
        executable,
        rubric,
        modifiedFiles: execResult.modifiedFiles,
        errorMessage: execResult.errorMessage,
      };
    } finally {
      this.removeDir(sandboxDir);
    }
  }

  private createSandbox(fixtureName: string): string {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'drupal-eval-'));
    const fixturePath = path.join(this.repoRoot, 'evals', 'fixtures', fixtureName);
    if (fs.existsSync(fixturePath)) {
      this.copyDir(fixturePath, tempDir);
    }
    return tempDir;
  }

  private copyDir(src: string, dest: string): void {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private removeDir(dir: string): void {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }

  private discoverCases(filterSkill?: string, filterCase?: string): EvalCase[] {
    const casesDir = path.join(this.repoRoot, 'evals', 'cases');
    const cases: EvalCase[] = [];

    if (!fs.existsSync(casesDir)) return [];

    for (const skillDir of fs.readdirSync(casesDir)) {
      if (filterSkill && skillDir !== filterSkill) continue;

      const skillPath = path.join(casesDir, skillDir);
      if (!fs.statSync(skillPath).isDirectory()) continue;

      for (const caseDir of fs.readdirSync(skillPath)) {
        if (filterCase && caseDir !== filterCase) continue;

        const casePath = path.join(skillPath, caseDir);
        const promptFile = path.join(casePath, 'prompt.md');
        const caseConfigFile = path.join(casePath, 'case.yaml');

        if (fs.existsSync(promptFile) && fs.existsSync(caseConfigFile)) {
          const prompt = fs.readFileSync(promptFile, 'utf-8').trim();
          const configRaw = fs.readFileSync(caseConfigFile, 'utf-8');
          const config = YAML.parse(configRaw) as CaseConfig;

          cases.push({
            name: caseDir,
            skill: skillDir,
            fixture: config.fixture ?? 'drupal-core-clean',
            prompt,
            config,
          });
        }
      }
    }

    return cases;
  }
}
