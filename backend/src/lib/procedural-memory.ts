// Procedural Memory - Agent creates skills from experience
// Inspired by Hermes Agent's skill_manage tool

import { generateId } from './crypto.js';
import * as fs from 'fs';
import * as path from 'path';

interface LearnedPattern {
  id: string;
  name: string;
  trigger: string;       // What prompts this skill
  solution: string;      // How the agent solved it
  successCount: number;
  lastUsed: number;
  createdAt: number;
  confidence: number;    // 0-1 based on success rate
}

class ProceduralMemory {
  private patterns: Map<string, LearnedPattern> = new Map();
  private patternsDir: string;

  constructor(patternsDir: string) {
    this.patternsDir = patternsDir;
  }

  async initialize(): Promise<void> {
    await this.loadPatterns();
  }

  private async loadPatterns(): Promise<void> {
    if (!fs.existsSync(this.patternsDir)) {
      fs.mkdirSync(this.patternsDir, { recursive: true });
      return;
    }

    const files = fs.readdirSync(this.patternsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.patternsDir, file), 'utf-8');
        const pattern = JSON.parse(content) as LearnedPattern;
        this.patterns.set(pattern.id, pattern);
      } catch (err) {
        console.error(`[ProceduralMemory] Failed to load ${file}:`, err);
      }
    }
    console.log(`[ProceduralMemory] Loaded ${this.patterns.size} learned patterns`);
  }

  private persistPattern(pattern: LearnedPattern): void {
    fs.writeFileSync(
      path.join(this.patternsDir, `${pattern.id}.json`),
      JSON.stringify(pattern, null, 2),
      'utf-8'
    );
  }

  // Called when agent successfully solves a complex problem
  recordSolution(prompt: string, solution: string, toolCount: number): void {
    if (toolCount < 5) return; // Only record complex tasks

    const id = generateId();
    const pattern: LearnedPattern = {
      id,
      name: this.generateName(prompt),
      trigger: prompt.slice(0, 200),
      solution: solution.slice(0, 500),
      successCount: 1,
      lastUsed: Date.now(),
      createdAt: Date.now(),
      confidence: 0.5
    };

    this.patterns.set(id, pattern);
    this.persistPattern(pattern);
    console.log(`[ProceduralMemory] Recorded pattern: ${pattern.name}`);
  }

  // Called when agent attempts to use a pattern
  recordUsage(patternId: string, success: boolean): void {
    const pattern = this.patterns.get(patternId);
    if (!pattern) return;

    pattern.lastUsed = Date.now();
    if (success) {
      pattern.successCount++;
      pattern.confidence = Math.min(0.95, pattern.confidence + 0.05);
    } else {
      pattern.confidence = Math.max(0.1, pattern.confidence - 0.1);
    }

    this.persistPattern(pattern);
  }

  private generateName(prompt: string): string {
    const words = prompt.split(/\s+/).slice(0, 3);
    return words.map(w => w.replace(/[^a-zA-Z]/g, '')).join('_') || 'unnamed_pattern';
  }

  // Find matching patterns for a prompt
  findPatterns(prompt: string): LearnedPattern[] {
    const promptLower = prompt.toLowerCase();
    return Array.from(this.patterns.values())
      .filter(p => 
        p.confidence > 0.3 &&
        (promptLower.includes(p.trigger.toLowerCase()) || 
         p.trigger.toLowerCase().includes(promptLower.slice(0, 50)))
      )
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  // Convert pattern to skill format for agent
  patternToSkill(p: LearnedPattern): string {
    return `## ${p.name}\n\n**Trigger:** ${p.trigger}\n\n**Solution:** ${p.solution}\n\n**Confidence:** ${(p.confidence * 100).toFixed(0)}%`;
  }

  // Get top patterns for context injection
  getTopPatterns(limit = 5): LearnedPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  // Self-improvement: identify patterns that need refinement
  identifyWeakPatterns(): LearnedPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.confidence < 0.4 && p.successCount > 2)
      .sort((a, b) => a.confidence - b.confidence);
  }

  // Merge similar patterns
  mergePatterns(id1: string, id2: string): LearnedPattern | null {
    const p1 = this.patterns.get(id1);
    const p2 = this.patterns.get(id2);
    if (!p1 || !p2) return null;

    const merged: LearnedPattern = {
      id: p1.id,
      name: p1.name,
      trigger: p1.trigger.length > p2.trigger.length ? p1.trigger : p2.trigger,
      solution: p1.solution + '\n\nAlternative: ' + p2.solution,
      successCount: p1.successCount + p2.successCount,
      lastUsed: Math.max(p1.lastUsed, p2.lastUsed),
      createdAt: Math.min(p1.createdAt, p2.createdAt),
      confidence: (p1.confidence + p2.confidence) / 2
    };

    this.patterns.set(merged.id, merged);
    this.patterns.delete(id2);
    this.persistPattern(merged);

    return merged;
  }

  getStats(): { totalPatterns: number; avgConfidence: number; highConfidence: number } {
    const patterns = Array.from(this.patterns.values());
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / Math.max(patterns.length, 1);
    return {
      totalPatterns: patterns.length,
      avgConfidence,
      highConfidence: patterns.filter(p => p.confidence > 0.7).length
    };
  }
}

const patternsDir = path.join(process.cwd(), 'data', 'patterns');
export const proceduralMemory = new ProceduralMemory(patternsDir);
export type { LearnedPattern };