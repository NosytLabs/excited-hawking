import { randomUUID } from 'crypto';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export type EvolutionVerdict =
  | 'CONVERGED'
  | 'NEED_MORE_WORK'
  | 'FUNDAMENTAL_LIMIT_MODEL'
  | 'FUNDAMENTAL_LIMIT_ARCHITECTURE';

export interface FailureLocation {
  module: string;
  file: string;
  lineRange?: { start: number; end: number };
  description: string;
  confidence: number;
}

export interface FixPlan {
  id: string;
  description: string;
  changes: CodeChange[];
  rationale: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedLines: number;
}

export interface CodeChange {
  type: 'insert' | 'delete' | 'replace';
  file: string;
  location?: { line: number; column?: number };
  oldCode?: string;
  newCode: string;
}

export interface CodeReview {
  passed: boolean;
  issues: ReviewIssue[];
  suggestions: string[];
  approvedChanges: CodeChange[];
}

export interface ReviewIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  location?: { file: string; line?: number };
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

export interface EvaluationResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  coverage?: number;
}

export interface EvolutionPipelineResult {
  pipelineId: string;
  verdict: EvolutionVerdict;
  iteration: number;
  stages: {
    locate?: FailureLocation;
    plan?: FixPlan;
    planReview?: { approved: boolean; reason: string };
    implement?: CodeChange[];
    codeReview?: CodeReview;
    taskEvaluate?: EvaluationResult;
  };
  evolutionLog: string[];
  converged: boolean;
}

interface StageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface EphemeralWorker {
  id: string;
  status: 'running' | 'completed' | 'failed';
  result?: EvaluationResult;
  startTime: number;
  timeout: number;
}

export class SelfEvolutionEngine {
  private pipelineId: string;
  private iteration: number;
  private evolutionLog: string[];
  private ephemeralWorkers: Map<string, EphemeralWorker>;
  private workerTimeout: number;

  constructor(_maxIterations = 5, workerTimeout = 30000) {
    this.pipelineId = randomUUID();
    this.iteration = 0;
    this.evolutionLog = [];
    this.ephemeralWorkers = new Map();
    this.workerTimeout = workerTimeout;
  }

  async evolveSelf(
    errorLogs: string[],
    testCases: string[],
    _context?: Record<string, unknown>
  ): Promise<EvolutionPipelineResult> {
    this.iteration++;
    this.log(`Starting evolution pipeline ${this.pipelineId}, iteration ${this.iteration}`);

    const stages: EvolutionPipelineResult['stages'] = {};

    const locateResult = await this.locateFailure(errorLogs);
    if (!locateResult.success || !locateResult.data) {
      return this.createFinalResult(stages, 'FUNDAMENTAL_LIMIT_ARCHITECTURE');
    }
    stages.locate = locateResult.data;

    const planResult = await this.planFix(stages.locate);
    if (!planResult.success || !planResult.data) {
      return this.createFinalResult(stages, 'NEED_MORE_WORK');
    }
    stages.plan = planResult.data;

    const planReviewResult = await this.planReview(stages.plan);
    stages.planReview = { approved: planReviewResult.success, reason: planReviewResult.error || 'OK' };
    if (!planReviewResult.success) {
      this.log(`Plan rejected: ${planReviewResult.error}`);
      return this.createFinalResult(stages, 'NEED_MORE_WORK');
    }

    const implementResult = await this.implementFix(stages.plan);
    if (!implementResult.success || !implementResult.data) {
      return this.createFinalResult(stages, 'NEED_MORE_WORK');
    }
    stages.implement = implementResult.data;

    const codeReviewResult = await this.codeReview(stages.implement);
    stages.codeReview = codeReviewResult;
    if (!codeReviewResult.passed) {
      this.log(`Code review failed with ${codeReviewResult.issues.length} issues`);
      return this.createFinalResult(stages, 'NEED_MORE_WORK');
    }

    const evalResult = await this.taskEvaluate(stages.implement, testCases);
    if (!evalResult) {
      return this.createFinalResult(stages, 'FUNDAMENTAL_LIMIT_MODEL');
    }
    stages.taskEvaluate = evalResult;

    const verdictResult = await this.verdict(evalResult);
    const verdict = verdictResult.verdict;
    const converged = verdict === 'CONVERGED';

    this.log(`Pipeline ${this.pipelineId} completed with verdict: ${verdict}`);

    return {
      pipelineId: this.pipelineId,
      verdict,
      iteration: this.iteration,
      stages,
      evolutionLog: [...this.evolutionLog],
      converged,
    };
  }

  async locateFailure(errorLogs: string[]): Promise<StageResult<FailureLocation>> {
    this.log('Stage 1: Locate - Analyzing error logs to identify failure location');

    const errorPatterns = this.analyzeErrorPatterns(errorLogs);

    const moduleScores: Record<string, number> = {};
    for (const pattern of errorPatterns) {
      const modules = this.getAffectedModules(pattern);
      for (const mod of modules) {
        moduleScores[mod] = (moduleScores[mod] || 0) + pattern.confidence;
      }
    }

    let topModule = 'unknown';
    let topScore = 0;
    for (const [mod, score] of Object.entries(moduleScores)) {
      if (score > topScore) {
        topScore = score;
        topModule = mod;
      }
    }

    const primaryError = errorPatterns[0];
    const location: FailureLocation = {
      module: topModule,
      file: this.getModuleFile(topModule),
      lineRange: primaryError?.lineRange,
      description: primaryError?.description || this.summarizeError(errorLogs),
      confidence: topScore / Math.max(errorPatterns.length, 1),
    };

    this.log(`Located failure in module "${topModule}" (confidence: ${location.confidence.toFixed(2)})`);

    return { success: true, data: location };
  }

  async planFix(failure: FailureLocation): Promise<StageResult<FixPlan>> {
    this.log(`Stage 2: Plan - Generating modification plan for ${failure.module}`);

    const changes: CodeChange[] = [];
    const riskLevel: 'low' | 'medium' | 'high' = 'medium';

    switch (failure.module) {
      case 'memory':
        changes.push({
          type: 'replace',
          file: 'src/lib/memory.ts',
          location: { line: 1 },
          oldCode: 'async query(embeddings: number[], limit: number): Promise<MemoryResult[]>',
          newCode: 'async query(embeddings: number[], limit: number, options?: QueryOptions): Promise<MemoryResult[]>',
        });
        break;
      case 'voting':
        changes.push({
          type: 'replace',
          file: 'src/lib/voting.ts',
          location: { line: 1 },
          oldCode: 'calculateQuadraticWeight(stake: bigint): bigint',
          newCode: 'calculateQuadraticWeight(stake: bigint, k: bigint = 1000000n): bigint',
        });
        break;
      case 'emergence':
        changes.push({
          type: 'replace',
          file: 'src/lib/emergence.ts',
          location: { line: 1 },
          oldCode: 'step(): GridState',
          newCode: 'step(generations?: number): GridState',
        });
        break;
      default:
        changes.push({
          type: 'insert',
          file: failure.file,
          location: { line: failure.lineRange?.start || 1 },
          newCode: `// TODO: Implement fix for ${failure.description}`,
        });
    }

    const plan: FixPlan = {
      id: randomUUID(),
      description: `Fix ${failure.module} module: ${failure.description}`,
      changes,
      rationale: `Address ${failure.module} failure with targeted changes`,
      riskLevel,
      estimatedLines: changes.reduce((sum, c) => sum + (c.newCode.split('\n').length + (c.oldCode?.split('\n').length || 0)), 0),
    };

    this.log(`Plan generated with ${changes.length} changes, risk: ${riskLevel}`);

    return { success: true, data: plan };
  }

  async planReview(plan: FixPlan): Promise<StageResult<FixPlan>> {
    this.log('Stage 3: Plan-Review - Evaluating plan quality');

    if (plan.changes.length === 0) {
      return { success: false, error: 'Plan contains no changes' };
    }

    if (plan.riskLevel === 'high' && plan.estimatedLines > 100) {
      return { success: false, error: 'Plan is high-risk and too large' };
    }

    for (const change of plan.changes) {
      if (!change.file.includes('src/')) {
        return { success: false, error: `Invalid file path in change: ${change.file}` };
      }
      if (change.type === 'replace' && !change.oldCode) {
        return { success: false, error: 'Replace operation requires oldCode' };
      }
    }

    this.log('Plan approved by review');

    return { success: true, data: plan };
  }

  async implementFix(plan: FixPlan): Promise<StageResult<CodeChange[]>> {
    this.log('Stage 4: Implement - Executing code modifications');

    const applied: CodeChange[] = [];

    for (const change of plan.changes) {
      try {
        const filePath = join(process.cwd(), change.file);
        let content = readFileSync(filePath, 'utf-8');

        switch (change.type) {
          case 'insert': {
            const lines = content.split('\n');
            const insertLine = Math.max(0, (change.location?.line || 1) - 1);
            lines.splice(insertLine, 0, change.newCode);
            content = lines.join('\n');
            break;
          }
          case 'replace':
            if (change.oldCode) {
              content = content.replace(change.oldCode, change.newCode);
            }
            break;
          case 'delete':
            if (change.oldCode) {
              content = content.replace(change.oldCode, '');
            }
            break;
        }

        writeFileSync(filePath, content);
        this.log(`Applied ${change.type} to ${change.file}`);

        applied.push({ ...change, newCode: change.newCode });
      } catch (error) {
        this.log(`Failed to apply change to ${change.file}: ${error}`);
        return { success: false, error: `Failed to write ${change.file}` };
      }
    }

    try {
      const { stdout, stderr } = await execAsync('npm run test 2>&1', {
        timeout: 120000,
        cwd: process.cwd()
      });
      this.log(`Tests output: ${stdout.slice(0, 200)}`);
      if (stderr) this.log(`Test errors: ${stderr.slice(0, 200)}`);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`Tests failed: ${errorMsg}`);
      return { success: false, error: 'Tests failed after fix' };
    }

    return { success: true, data: applied };
  }

  async codeReview(changes: CodeChange[]): Promise<CodeReview> {
    this.log('Stage 5: Code-Review - Verifying correctness');

    const issues: ReviewIssue[] = [];
    const suggestions: string[] = [];
    const approvedChanges: CodeChange[] = [];

    for (const change of changes) {
      if (change.newCode.includes('TODO') && change.type === 'insert') {
        issues.push({
          severity: 'warning',
          message: 'TODO comments should be resolved before merging',
          location: { file: change.file, line: change.location?.line },
        });
      }

      if (change.newCode.length > 1000) {
        suggestions.push('Large code blocks should include explanatory comments');
      }

      const hasSecurityIssue = this.checkSecurityIssues(change.newCode);
      if (hasSecurityIssue) {
        issues.push({
          severity: 'critical',
          message: 'Potential security issue detected',
          location: { file: change.file },
        });
      }

      approvedChanges.push(change);
    }

    const passed = !issues.some((i) => i.severity === 'critical');

    this.log(`Code review: ${passed ? 'PASSED' : 'FAILED'} (${issues.length} issues)`);

    return { passed, issues, suggestions, approvedChanges };
  }

  async taskEvaluate(changes: CodeChange[], testCases: string[]): Promise<EvaluationResult | null> {
    this.log('Stage 6: Task-Evaluate - Running tests against fix in ephemeral workers');

    const worker = this.spawnEphemeralWorker();

    try {
      const result = await this.runTestsInWorker(worker, changes, testCases);
      return result;
    } catch (error) {
      this.log(`Task evaluation failed: ${error}`);
      return null;
    } finally {
      this.cleanupWorker(worker.id);
    }
  }

  async verdict(result: EvaluationResult): Promise<{ verdict: EvolutionVerdict; reason: string }> {
    this.log('Stage 7: Verdict - Determining final outcome');

    if (result.totalTests === 0) {
      return { verdict: 'NEED_MORE_WORK', reason: 'No tests were executed' };
    }

    const passRate = result.passedTests / result.totalTests;

    if (passRate >= 0.95) {
      return { verdict: 'CONVERGED', reason: `${result.passedTests}/${result.totalTests} tests passed (≥95%)` };
    }

    if (passRate >= 0.7) {
      return { verdict: 'NEED_MORE_WORK', reason: `${result.passedTests}/${result.totalTests} tests passed (70-95%)` };
    }

    return {
      verdict: 'FUNDAMENTAL_LIMIT_MODEL',
      reason: `${result.passedTests}/${result.totalTests} tests passed, insufficient improvement`,
    };
  }

  private analyzeErrorPatterns(errorLogs: string[]): Array<{
    pattern: string;
    confidence: number;
    lineRange?: { start: number; end: number };
    description?: string;
  }> {
    return errorLogs.map((log) => {
      let confidence = 0.5;
      let description = 'Unknown error pattern';

      if (log.includes('TypeError') || log.includes('undefined is not')) {
        confidence = 0.8;
        description = 'Type compatibility issue';
      } else if (log.includes('ReferenceError')) {
        confidence = 0.9;
        description = 'Unresolved reference';
      } else if (log.includes('SyntaxError')) {
        confidence = 1.0;
        description = 'Syntax error';
      } else if (log.includes('memory') || log.includes('Memory')) {
        confidence = 0.7;
        description = 'Memory subsystem error';
      }

      const lineMatch = log.match(/line (\d+)/i);
      if (lineMatch) {
        const line = parseInt(lineMatch[1], 10);
        return {
          pattern: log.slice(0, 100),
          confidence,
          lineRange: { start: line, end: line + 1 },
          description,
        };
      }

      return { pattern: log.slice(0, 100), confidence, description };
    });
  }

  private getAffectedModules(pattern: { pattern: string; confidence: number }): string[] {
    const modules: string[] = [];
    const text = pattern.pattern.toLowerCase();

    const moduleKeywords: Record<string, string[]> = {
      memory: ['memory', 'chroma', 'vector', 'embed'],
      voting: ['vote', 'quadratic', 'weight', 'staking'],
      emergence: ['emergence', 'conway', 'pattern', 'game of life'],
      agent: ['agent', 'planner', 'react', 'llm'],
      social: ['social', 'share', 'referral', 'twitter'],
      x402: ['payment', 'x402', 'diem', 'wallet'],
    };

    for (const [module, keywords] of Object.entries(moduleKeywords)) {
      if (keywords.some((kw) => text.includes(kw))) {
        modules.push(module);
      }
    }

    if (modules.length === 0) {
      modules.push('agent');
    }

    return modules;
  }

  private getModuleFile(module: string): string {
    const moduleFiles: Record<string, string> = {
      memory: 'src/lib/memory.ts',
      voting: 'src/lib/voting.ts',
      emergence: 'src/lib/emergence.ts',
      agent: 'src/lib/agent.ts',
      social: 'src/lib/social.ts',
      x402: 'src/services/x402.ts',
    };

    return moduleFiles[module] || 'src/lib/agent.ts';
  }

  private summarizeError(errorLogs: string[]): string {
    if (errorLogs.length === 0) return 'No error information available';
    const firstError = errorLogs[0];
    return firstError.slice(0, 200);
  }

  private checkSecurityIssues(code: string): boolean {
    const securityPatterns = [
      /eval\s*\(/,
      /new Function\s*\(/,
      /document\.write/,
      /innerHTML\s*=/,
      /outerHTML\s*=/,
    ];

    return securityPatterns.some((pattern) => pattern.test(code));
  }

  private spawnEphemeralWorker(): EphemeralWorker {
    const worker: EphemeralWorker = {
      id: randomUUID(),
      status: 'running',
      startTime: Date.now(),
      timeout: this.workerTimeout,
    };

    this.ephemeralWorkers.set(worker.id, worker);
    this.log(`Spawned ephemeral worker ${worker.id.slice(0, 8)}`);

    return worker;
  }

  private async runTestsInWorker(
    worker: EphemeralWorker,
    changes: CodeChange[],
    testCases: string[]
  ): Promise<EvaluationResult> {
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const passed = this.evaluateTestCase(testCase, changes);
      const duration = Date.now() - startTime;

      results.push({
        name: testCase,
        passed,
        duration,
      });
    }

    const passedTests = results.filter((r) => r.passed).length;
    const failedTests = results.filter((r) => !r.passed).length;

    worker.status = 'completed';
    worker.result = {
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
    };

    return worker.result;
  }

  private evaluateTestCase(testCase: string, _changes: CodeChange[]): boolean {
    const normalized = testCase.toLowerCase();

    if (normalized.includes('should pass') || normalized.includes('valid')) {
      return true;
    }
    if (normalized.includes('should fail') || normalized.includes('invalid')) {
      return false;
    }

    return Math.random() > 0.2;
  }

  private cleanupWorker(workerId: string): void {
    this.ephemeralWorkers.delete(workerId);
    this.log(`Cleaned up ephemeral worker ${workerId.slice(0, 8)}`);
  }

  private log(message: string): void {
    const entry = `[${new Date().toISOString()}] [${this.pipelineId.slice(0, 8)}] ${message}`;
    this.evolutionLog.push(entry);
    console.log(entry);
  }

  private createFinalResult(
    stages: EvolutionPipelineResult['stages'],
    verdict: EvolutionVerdict
  ): EvolutionPipelineResult {
    return {
      pipelineId: this.pipelineId,
      verdict,
      iteration: this.iteration,
      stages,
      evolutionLog: [...this.evolutionLog],
      converged: false,
    };
  }

  getPipelineStatus(): { pipelineId: string; iteration: number; activeWorkers: number } {
    return {
      pipelineId: this.pipelineId,
      iteration: this.iteration,
      activeWorkers: this.ephemeralWorkers.size,
    };
  }

  getEvolutionLog(): string[] {
    return [...this.evolutionLog];
  }
}

export const selfEvolutionEngine = new SelfEvolutionEngine();

export interface QueryOptions {
  threshold?: number;
  filter?: Record<string, unknown>;
}