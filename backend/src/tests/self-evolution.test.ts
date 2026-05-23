import { describe, it, expect } from 'vitest';
import { SelfEvolutionEngine } from '../services/self-evolution.js';

describe('SelfEvolutionEngine', () => {
  it('should complete pipeline and apply changes', async () => {
    const engine = new SelfEvolutionEngine(5, 180000);
    
    const result = await engine.evolveSelf(
      ['TypeError: Cannot read property "query" of undefined'],
      ['should pass valid query', 'should handle empty results']
    );
    
    console.log('Evolution result:', JSON.stringify(result, null, 2));
    expect(result.pipelineId).toBeDefined();
    expect(result.iteration).toBe(1);
    expect(result.stages).toBeDefined();
  });

  it('should detect failure location', async () => {
    const engine = new SelfEvolutionEngine(5, 180000);
    
    const result = await engine.evolveSelf(
      ['ReferenceError: something is not defined'],
      ['should work correctly']
    );
    
    expect(result.stages.locate).toBeDefined();
    expect(result.stages.locate?.confidence).toBeGreaterThan(0);
  });

  it('should create fix plan', async () => {
    const engine = new SelfEvolutionEngine(5, 180000);
    
    const result = await engine.evolveSelf(
      ['TypeError: undefined is not an object'],
      ['should handle undefined gracefully']
    );
    
    expect(result.stages.plan).toBeDefined();
    expect(result.stages.plan?.changes).toBeDefined();
  });
});