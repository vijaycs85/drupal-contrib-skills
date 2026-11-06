export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentExecutionResult {
  outputText: string;
  exitCode: number;
  modifiedFiles: string[];
  diff: string;
  toolEvents?: Array<Record<string, unknown>>;
  durationSeconds: number;
  rawOutput: string;
  errorMessage?: string;
  tokens?: TokenUsage;
}

export interface AgentAdapter {
  name: string;
  execute(
    prompt: string,
    workspaceDir: string,
    skills: Record<string, string>,
    options?: Record<string, unknown>
  ): Promise<AgentExecutionResult>;
}

export interface CaseConfig {
  name: string;
  skill: string;
  fixture: string;
  mode?: 'explicit' | 'auto' | 'both';
  quality_criteria?: Record<string, string>;
  executable_checks?: {
    file_exists?: string[];
    file_not_exists?: string[];
    content_contains?: Array<{ file: string; pattern?: string; text?: string }>;
    content_not_contains?: Array<{ file: string; pattern?: string; text?: string }>;
    command_checks?: Array<{ command: string; expected_exit_code?: number }>;
  };
}

export interface EvalCase {
  name: string;
  skill: string;
  fixture: string;
  prompt: string;
  config: CaseConfig;
}

export interface ExecutableCheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface ExecutableGradingResult {
  passed: boolean;
  passedCount: number;
  failedCount: number;
  checks: ExecutableCheckResult[];
}

export interface RubricDimensionScore {
  score: number; // 0 - 4
  max: number; // 4
  comment: string;
}

export interface RubricScore {
  normalizedScore: number; // 0 - 100
  dimensions: Record<string, RubricDimensionScore>;
  overallFeedback: string;
}

export interface EvalTrialResult {
  trial: number;
  condition: 'with-skill' | 'baseline-no-skill';
  duration: number;
  tokens?: TokenUsage;
  executable: ExecutableGradingResult;
  rubric: RubricScore;
  modifiedFiles: string[];
  errorMessage?: string;
}

export interface EvalCaseResult {
  name: string;
  skill: string;
  fixture: string;
  trials: EvalTrialResult[];
}

export interface EvalSuiteResult {
  timestamp: string;
  adapter: string;
  totalCases: number;
  trialsPerCase: number;
  cases: EvalCaseResult[];
  summary: {
    totalEvaluations: number;
    executablePassed: number;
    averageScore: number;
    totalTokens: number;
    withSkillAvgTokens: number;
    baselineAvgTokens: number;
  };
}
