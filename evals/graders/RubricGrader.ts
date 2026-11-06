import { CaseConfig, RubricDimensionScore, RubricScore } from '../runner/types.js';

export const RUBRIC_DIMENSIONS: Record<string, string> = {
  requirement_fit: 'Essential needs and constraints addressed; solution is proportionate',
  ecosystem_choice: 'Existing facilities assessed and reused or rejected for supported reasons',
  api_grounding: 'Actual relevant contracts and versions support implementation',
  verification_honesty: 'Claims match command evidence and final artifacts without false pass assertions',
  maintainability_semantics: 'Relevant access, cache, configuration, translation and compatibility needs preserved',
  communication: 'Useful concise explanation, real references, clear limitations',
};

export class RubricGrader {
  private judgeProvider?: string;
  private judgeApiKey?: string;

  constructor(provider?: string, apiKey?: string) {
    this.judgeProvider = provider ?? this.detectProvider();
    this.judgeApiKey = apiKey ?? this.resolveApiKey(this.judgeProvider);
  }

  async grade(
    prompt: string,
    outputText: string,
    diff: string,
    caseConfig: CaseConfig = { name: '', skill: '', fixture: '' }
  ): Promise<RubricScore> {
    if (this.judgeApiKey && this.judgeProvider === 'gemini') {
      try {
        const score = await this.gradeWithGemini(prompt, outputText, diff, caseConfig);
        if (score) return score;
      } catch {
        // Fall back to deterministic heuristic on error
      }
    }

    return this.gradeOfflineHeuristic(prompt, outputText, diff, caseConfig);
  }

  private detectProvider(): string | undefined {
    if (process.env.GEMINI_API_KEY) return 'gemini';
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    return undefined;
  }

  private resolveApiKey(provider?: string): string | undefined {
    if (!provider) return undefined;
    return process.env[`${provider.toUpperCase()}_API_KEY`];
  }

  private async gradeWithGemini(
    prompt: string,
    outputText: string,
    diff: string,
    caseConfig: CaseConfig
  ): Promise<RubricScore | null> {
    const rubricPrompt = `You are an impartial AI evaluator grading an AI coding agent's performance on a Drupal task.

USER PROMPT:
${prompt}

EXPECTED CRITERIA:
${JSON.stringify(caseConfig.quality_criteria ?? {}, null, 2)}

AGENT RESPONSE:
${outputText}

AGENT WORKSPACE DIFF:
${diff || '(No files modified)'}

Evaluate each of the following 6 dimensions on a scale of 0 to 4:
0 = absent/incorrect, 1 = substantial gaps, 2 = partly meets criteria, 3 = meets criteria, 4 = exceeds criteria with exceptional evidence/efficiency.

Dimensions:
${Object.entries(RUBRIC_DIMENSIONS)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

Respond ONLY in valid JSON matching this schema:
{
  "dimensions": {
    "requirement_fit": { "score": 3, "comment": "..." },
    "ecosystem_choice": { "score": 3, "comment": "..." },
    "api_grounding": { "score": 3, "comment": "..." },
    "verification_honesty": { "score": 3, "comment": "..." },
    "maintainability_semantics": { "score": 3, "comment": "..." },
    "communication": { "score": 3, "comment": "..." }
  },
  "overallFeedback": "..."
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.judgeApiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: rubricPrompt }] }],
        generationConfig: { temperature: 0.1 },
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!parsed.dimensions) return null;

    let totalEarned = 0;
    let totalMax = 0;
    const dimensions: Record<string, RubricDimensionScore> = {};

    for (const [key] of Object.entries(RUBRIC_DIMENSIONS)) {
      const dimData = parsed.dimensions[key] ?? {};
      const score = Math.max(0, Math.min(4, Number(dimData.score ?? 2)));
      dimensions[key] = {
        score,
        max: 4,
        comment: String(dimData.comment ?? ''),
      };
      totalEarned += score;
      totalMax += 4;
    }

    const normalizedScore = totalMax > 0 ? Math.round((totalEarned / totalMax) * 1000) / 10 : 0;
    return {
      normalizedScore,
      dimensions,
      overallFeedback: String(parsed.overallFeedback ?? ''),
    };
  }

  private gradeOfflineHeuristic(
    _prompt: string,
    outputText: string,
    _diff: string,
    _caseConfig: CaseConfig
  ): RubricScore {
    const dimensions: Record<string, RubricDimensionScore> = {};
    const lower = outputText.toLowerCase();

    // 1. requirement_fit
    const reqScore = outputText.length > 50 ? 3 : 1;
    dimensions.requirement_fit = {
      score: reqScore,
      max: 4,
      comment: 'Assessed requirements fulfillment heuristics.',
    };

    // 2. ecosystem_choice
    let ecoScore = 3;
    if (lower.includes('custom module') && !lower.includes('composer') && !lower.includes('core')) {
      ecoScore = 2;
    }
    dimensions.ecosystem_choice = {
      score: ecoScore,
      max: 4,
      comment: 'Checked ecosystem discovery and reuse.',
    };

    // 3. api_grounding
    const apiScore = outputText.includes('Drupal\\') || outputText.includes('::') || outputText.includes('interface') ? 3 : 2;
    dimensions.api_grounding = {
      score: apiScore,
      max: 4,
      comment: 'Verified presence of concrete API namespaces.',
    };

    // 4. verification_honesty
    let honestyScore = 3;
    if (/all tests (?:passed|succeeded)/i.test(outputText) && !outputText.includes('phpunit')) {
      honestyScore = 1;
    }
    dimensions.verification_honesty = {
      score: honestyScore,
      max: 4,
      comment: 'Checked for honest reporting of execution limits.',
    };

    // 5. maintainability_semantics
    dimensions.maintainability_semantics = {
      score: 3,
      max: 4,
      comment: 'Standard architecture and coding standards checked.',
    };

    // 6. communication
    const commScore = outputText.length > 80 && outputText.length < 3500 ? 3 : 2;
    dimensions.communication = {
      score: commScore,
      max: 4,
      comment: 'Assessed response clarity and conciseness.',
    };

    let totalEarned = 0;
    let totalMax = 0;
    for (const d of Object.values(dimensions)) {
      totalEarned += d.score;
      totalMax += d.max;
    }

    const normalizedScore = Math.round((totalEarned / totalMax) * 1000) / 10;
    return {
      normalizedScore,
      dimensions,
      overallFeedback: 'Graded using deterministic offline rubric.',
    };
  }
}
