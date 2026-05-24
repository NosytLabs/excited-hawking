import { describe, it, expect, vi } from 'vitest';
import { SelfEvolutionEngine } from '../services/self-evolution.js';

describe('SelfEvolutionEngine', () => {
  it('should complete pipeline and apply changes', async () => {
    const engine = new SelfEvolutionEngine(5, 180000);
    const implementChanges = [
      {
        type: 'replace' as const,
        file: 'src/lib/memory.ts',
        oldCode: 'oldCode',
        newCode: 'newCode'
      }
    ];
    const evaluation = {
      totalTests: 2,
      passedTests: 2,
      failedTests: 0,
      results: [
        { name: 'should pass valid query', passed: true, duration: 1 },
        { name: 'should handle empty results', passed: true, duration: 1 }
      ]
    };

    vi.spyOn(engine, 'implementFix').mockResolvedValue({ success: true, data: implementChanges });
    vi.spyOn(engine, 'codeReview').mockResolvedValue({
      passed: true,
      issues: [],
      suggestions: [],
      approvedChanges: implementChanges
    });
    vi.spyOn(engine, 'taskEvaluate').mockResolvedValue(evaluation);
    vi.spyOn(engine, 'verdict').mockResolvedValue({
      verdict: 'CONVERGED',
      reason: '2/2 tests passed (>=95%)'
    });
    
    const result = await engine.evolveSelf(
      ['TypeError: Cannot read property "query" of undefined'],
      ['should pass valid query', 'should handle empty results']
    );

    expect(result.pipelineId).toBeDefined();
    expect(result.iteration).toBe(1);
    expect(result.stages.implement).toEqual(implementChanges);
    expect(result.stages.taskEvaluate).toEqual(evaluation);
    expect(result.converged).toBe(true);
  });

  it('should detect failure location', async () => {
    const engine = new SelfEvolutionEngine(5, 180000);
    
    const result = await engine.locateFailure(['ReferenceError: something is not defined']);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.confidence).toBeGreaterThan(0);
  });

  it('should create fix plan', async () => {
    const engine = new SelfEvolutionEngine(5, 180000);
    const failure = {
      module: 'memory',
      file: 'src/lib/memory.ts',
      description: 'Type compatibility issue',
      confidence: 0.8
    };
    
    const result = await engine.planFix(failure);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.changes).toBeDefined();
  });
});
