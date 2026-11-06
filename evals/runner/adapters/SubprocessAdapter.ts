import { execSync, spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { AgentAdapter, AgentExecutionResult } from '../types.js';

export class SubprocessAdapter implements AgentAdapter {
  name = 'subprocess';
  private commandTemplate: string;

  constructor(commandTemplate: string = 'claude -p "{prompt}"') {
    this.commandTemplate = commandTemplate;
  }

  async execute(
    prompt: string,
    workspaceDir: string,
    skills: Record<string, string>,
    _options?: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const startTime = performance.now();

    // Provision skills into .agents/skills/
    this.provisionSkills(workspaceDir, skills);

    // Initialize git repository if needed
    if (!fs.existsSync(path.join(workspaceDir, '.git'))) {
      execSync('git init -q && git add -A && git commit -q -m "Initial fixture state" --allow-empty', {
        cwd: workspaceDir,
        stdio: 'ignore',
      });
    }

    const command = this.commandTemplate
      .replace('{prompt}', prompt.replace(/"/g, '\\"'))
      .replace('{workspace}', workspaceDir);

    return new Promise((resolve) => {
      const child = spawn(command, {
        cwd: workspaceDir,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => (stdout += chunk.toString()));
      child.stderr.on('data', (chunk) => (stderr += chunk.toString()));

      child.on('close', (code) => {
        const duration = (performance.now() - startTime) / 1000;

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
          // Ignore git diff errors
        }

        resolve({
          outputText: stdout.trim(),
          exitCode: code ?? 0,
          modifiedFiles,
          diff,
          durationSeconds: Math.round(duration * 1000) / 1000,
          rawOutput: stdout + (stderr ? `\nSTDERR:\n${stderr}` : ''),
          errorMessage: code !== 0 ? `Subprocess exited with code ${code}` : undefined,
        });
      });
    });
  }

  private provisionSkills(workspaceDir: string, skills: Record<string, string>): void {
    if (Object.keys(skills).length === 0) return;

    const baseDir = path.join(workspaceDir, '.agents', 'skills');
    for (const [skillName, content] of Object.entries(skills)) {
      const targetDir = path.join(baseDir, skillName);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'SKILL.md'), content);
    }
  }
}
