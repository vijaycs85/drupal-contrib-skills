import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AgentAdapter, AgentExecutionResult } from '../types.js';

export class ApiAdapter implements AgentAdapter {
  name: string;
  private provider: 'gemini' | 'anthropic' | 'openai';
  private apiKey: string;
  private model: string;

  constructor(provider?: 'gemini' | 'anthropic' | 'openai', apiKey?: string, model?: string) {
    this.provider = provider ?? this.detectProvider();
    this.name = `api-${this.provider}`;
    this.apiKey = apiKey ?? this.resolveApiKey(this.provider);
    this.model = model ?? this.defaultModel(this.provider);
  }

  async execute(
    prompt: string,
    workspaceDir: string,
    skills: Record<string, string>,
    _options?: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const startTime = performance.now();

    if (!this.apiKey) {
      return {
        outputText: '',
        exitCode: 1,
        modifiedFiles: [],
        diff: '',
        durationSeconds: 0,
        rawOutput: '',
        errorMessage: `Missing API key for provider '${this.provider}'. Set ${this.envVarName(this.provider)} in environment.`,
      };
    }

    if (!fs.existsSync(path.join(workspaceDir, '.git'))) {
      execSync('git init -q && git add -A && git commit -q -m "Initial fixture state" --allow-empty', {
        cwd: workspaceDir,
        stdio: 'ignore',
      });
    }

    const workspaceContext = this.buildWorkspaceContext(workspaceDir);

    let systemPrompt = 'You are an expert Drupal AI coding assistant.\n';
    if (Object.keys(skills).length > 0) {
      systemPrompt += 'You have access to the following skills:\n\n';
      for (const [name, content] of Object.entries(skills)) {
        systemPrompt += `=== Skill: ${name} ===\n${content}\n\n`;
      }
    }
    systemPrompt += `WORKSPACE CONTEXT:\n${workspaceContext}\n\n`;
    systemPrompt += 'When modifying or creating files, output clear code blocks formatted as:\n';
    systemPrompt += '```filepath:path/to/file.ext\n<content>\n```\n';
    systemPrompt += 'Provide technical assessment, approach, pattern references, and honest verification statements.';

    let outputText = '';
    let tokensUsed: number | undefined;

    try {
      const res = await this.callProvider(systemPrompt, prompt);
      outputText = res.text;
      tokensUsed = res.tokens;
    } catch (err: unknown) {
      return {
        outputText: '',
        exitCode: 1,
        modifiedFiles: [],
        diff: '',
        durationSeconds: (performance.now() - startTime) / 1000,
        rawOutput: '',
        errorMessage: err instanceof Error ? err.message : String(err),
      };
    }

    this.applyFileChanges(workspaceDir, outputText);

    let diff = '';
    let modifiedFiles: string[] = [];

    try {
      diff = execSync('git diff HEAD', { cwd: workspaceDir, encoding: 'utf-8' });
      const status = execSync('git status --porcelain', { cwd: workspaceDir, encoding: 'utf-8' });
      modifiedFiles = status
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => line.split(/\s+/)[1])
        .filter(Boolean);
    } catch {
      // Ignore git errors
    }

    const duration = (performance.now() - startTime) / 1000;

    return {
      outputText,
      exitCode: 0,
      modifiedFiles,
      diff,
      durationSeconds: Math.round(duration * 1000) / 1000,
      rawOutput: outputText,
      tokensUsed,
    };
  }

  private detectProvider(): 'gemini' | 'anthropic' | 'openai' {
    if (process.env.GEMINI_API_KEY) return 'gemini';
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
    if (process.env.OPENAI_API_KEY) return 'openai';
    return 'gemini';
  }

  private resolveApiKey(provider: string): string {
    return process.env[this.envVarName(provider)] ?? '';
  }

  private envVarName(provider: string): string {
    switch (provider) {
      case 'gemini':
        return 'GEMINI_API_KEY';
      case 'anthropic':
        return 'ANTHROPIC_API_KEY';
      case 'openai':
        return 'OPENAI_API_KEY';
      default:
        return 'API_KEY';
    }
  }

  private defaultModel(provider: string): string {
    switch (provider) {
      case 'gemini':
        return 'gemini-3.8-flash';
      case 'anthropic':
        return 'claude-3-5-sonnet-latest';
      case 'openai':
        return 'gpt-4o';
      default:
        return 'gemini-3.8-flash';
    }
  }

  private async callProvider(systemPrompt: string, userPrompt: string): Promise<{ text: string; tokens?: number }> {
    if (this.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const payload = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2 },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const tokens = data.usageMetadata?.totalTokenCount;
      return { text, tokens };
    }

    if (this.provider === 'anthropic') {
      const url = 'https://api.anthropic.com/v1/messages';
      const payload = {
        model: this.model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Anthropic API HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const text = data.content?.[0]?.text ?? '';
      const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0);
      return { text, tokens };
    }

    if (this.provider === 'openai') {
      const url = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`OpenAI API HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const text = data.choices?.[0]?.message?.content ?? '';
      const tokens = data.usage?.total_tokens;
      return { text, tokens };
    }

    throw new Error(`Unsupported provider: ${this.provider}`);
  }

  private buildWorkspaceContext(workspaceDir: string): string {
    let context = 'Files in workspace:\n';
    try {
      const files = execSync('find . -maxdepth 4 -not -path "*/.*" | sort', {
        cwd: workspaceDir,
        encoding: 'utf-8',
      });
      context += files + '\n\n';
    } catch {
      // Ignore
    }

    const composerJson = path.join(workspaceDir, 'composer.json');
    if (fs.existsSync(composerJson)) {
      context += '--- composer.json ---\n' + fs.readFileSync(composerJson, 'utf-8') + '\n';
    }

    const composerLock = path.join(workspaceDir, 'composer.lock');
    if (fs.existsSync(composerLock)) {
      try {
        const lock = JSON.parse(fs.readFileSync(composerLock, 'utf-8'));
        const pkgs = Object.fromEntries((lock.packages ?? []).map((p: any) => [p.name, p.version]));
        context += '--- composer.lock packages ---\n' + JSON.stringify(pkgs, null, 2) + '\n';
      } catch {
        // Ignore
      }
    }

    return context;
  }

  private applyFileChanges(workspaceDir: string, output: string): void {
    const fileRegex = /```(?:filepath:([^\n]+)|([a-z0-9_-]+)\s*\/\/\s*file:\s*([^\n]+))\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = fileRegex.exec(output)) !== null) {
      const relativePath = (match[1] || match[3]).trim();
      const content = match[4];

      const targetPath = path.join(workspaceDir, relativePath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, content);
    }
  }
}
