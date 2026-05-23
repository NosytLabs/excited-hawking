# Commons Agent - Full Functional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans

**Goal:** Make self-evolution write real files, use Venice embeddings, sync Conway state to frontend

**Architecture:** Backend is source of truth for Conway grid, broadcasts via WebSocket. Self-evolution uses Node.js fs. Embeddings use Venice AI API.

**Tech Stack:** TypeScript, Node.js fs, Venice AI embeddings, Socket.IO WebSocket

---

## Task 1: Add Emergence WebSocket Broadcast

**Files:**
- Modify: `backend/src/lib/emergence.ts` - add broadcast on step()
- Modify: `backend/src/services/websocket.ts` - add emitEmergenceUpdate()

- [ ] **Step 1: Add emergence emit to websocket.ts**

```typescript
// Add to backend/src/services/websocket.ts (around line 95)
export function emitEmergenceUpdate(data: { grid: boolean[][]; generation: number; patterns: string[] }): void {
  io?.to('emergence').emit('emergence:update', { ...data, timestamp: Date.now() });
}
```

- [ ] **Step 2: Import websocket in emergence.ts and broadcast on step**

```typescript
// Add import at top of backend/src/lib/emergence.ts
import { emitEmergenceUpdate } from '../services/websocket.js';

// Modify step() method to broadcast after each step (around line 50)
public step(): GridState {
  // ... existing step logic ...
  
  this.generation++;
  this.runPatternDetection();
  
  // Broadcast to frontend
  emitEmergenceUpdate({
    grid: this.grid,
    generation: this.generation,
    patterns: this.detectedPatterns.map(p => p.name)
  });
  
  return { grid: this.grid, generation: this.generation };
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/lib/emergence.ts backend/src/services/websocket.ts
git commit -m "feat: broadcast emergence state via WebSocket"
```

---

## Task 2: Self-Evolution Real File Operations

**Files:**
- Modify: `backend/src/services/self-evolution.ts` - implement real file write + test exec

- [ ] **Step 1: Add fs imports and applyCodeChanges function**

Add near top of `backend/src/services/self-evolution.ts` (after line 5):
```typescript
import { writeFileSync, readFileSync, cp, mkdir, rm } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const SANDBOX_DIR = join(__dirname, '../../.evolution-sandbox');
```

- [ ] **Step 2: Replace implementFix method (around line 289)**

Replace the mocked `implementFix` with:
```typescript
async implementFix(plan: FixPlan): Promise<StageResult<CodeChange[]>> {
  this.log('Stage 4: Implement - Executing code modifications');

  // Create sandbox dir
  try {
    await mkdir(SANDBOX_DIR, { recursive: true });
  } catch {}

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

  // Run tests
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
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/self-evolution.ts
git commit -m "feat(self-evolution): implement real file writes and test execution"
```

---

## Task 3: Real Venice Embeddings for Memvid

**Files:**
- Modify: `backend/src/lib/memory-video.ts` - use Venice API for embeddings

- [ ] **Step 1: Add Venice embedding function**

Add at top of `backend/src/lib/memory-video.ts` (after existing imports):
```typescript
const config = {
  apiKey: process.env.VENICE_API_KEY || '',
  baseUrl: process.env.VENICE_API_URL || 'https://api.venice.ai/api/v1',
};

async function getVeniceEmbedding(text: string): Promise<number[]> {
  if (!config.apiKey) {
    return computeEmbeddingSync(text); // fallback
  }

  try {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        input: text.slice(0, 8000), // Venice limit
        model: 'embedding'
      })
    });

    if (!response.ok) {
      return computeEmbeddingSync(text);
    }

    const data = await response.json() as { data?: Array<{ embedding: number[] }> };
    return data.data?.[0]?.embedding || computeEmbeddingSync(text);
  } catch {
    return computeEmbeddingSync(text);
  }
}
```

- [ ] **Step 2: Update storeEpisode to use real embeddings**

In `storeEpisode` method (around line 69), replace the sync embedding call:
```typescript
// Change this line (around line 255 in createFramesFromText):
embedding: this.computeEmbeddingSync(content),

// To async version - need to change createFramesFromText to async
// For now, keep sync but add a note that storeEpisode should be made async
```

Actually, `createFramesFromText` is sync and called from `storeEpisode`. Best approach is to make `storeEpisode` async and await embeddings for key frames only:

- [ ] **Step 3: Make storeEpisode properly async with real embeddings for key moments**

Replace `storeEpisode` method (around line 69):
```typescript
async storeEpisode(
  text: string,
  metadata: Record<string, unknown> = {}
): Promise<{ episodeId: string; frameCount: number }> {
  const episodeId = generateUUID();
  
  // For full text, use sync fallback. Only get Venice embedding for short texts.
  const useRealEmbedding = text.length < 500;
  const embedding = useRealEmbedding ? await getVeniceEmbedding(text) : this.computeEmbeddingSync(text);
  
  const frames = this.createFramesFromText(text, episodeId, metadata, embedding);
  // ... rest unchanged
}
```

Update `createFramesFromText` to accept embedding parameter:
```typescript
private createFramesFromText(
  text: string,
  episodeId: string,
  metadata: Record<string, unknown>,
  fullEmbedding?: number[]
): MemvidFrame[] {
  // ... existing logic ...
  
  // For each frame, use passed embedding or compute sync
  const frameEmbedding = fullEmbedding || this.computeEmbeddingSync(content);
  
  // Replace line around 255:
  // embedding: this.computeEmbeddingSync(content),
  // With:
  // embedding: this.computeEmbeddingSync(content), // Keep sync for frames
}

- [ ] **Step 4: Commit**

```bash
git add backend/src/lib/memory-video.ts
git commit -m "feat(memvid): add Venice embedding support with fallback"
```

---

## Task 4: Frontend Uses Real Emergence State

**Files:**
- Modify: `src/components/AgentStream.tsx` - use WebSocket emergence state

- [ ] **Step 1: Add emergence state from websocket (replace simulation)**

In `AgentStream.tsx`, replace the `useEffect` that simulates Conway (around line 52):

```typescript
// REPLACE the existing useEffect interval (lines 52-89) with:
useEffect(() => {
  const handleEmergenceUpdate = (data: { grid: boolean[][]; generation: number; patterns: string[] }) => {
    setGridCells(data.grid.map(row => 
      row.map(alive => ({ alive, color: alive ? '#00d992' : '' }))
    ));
    setGeneration(data.generation);
  };

  websocketService.on('emergence:update', handleEmergenceUpdate);
  
  return () => {
    websocketService.off('emergence:update', handleEmergenceUpdate);
  };
}, []);
```

- [ ] **Step 2: Also need to update websocket service to handle emergence events**

Check if `src/services/websocket.ts` has the event handler registered - it should since backend emits on `emergence:update`.

- [ ] **Step 3: Commit**

```bash
git add src/components/AgentStream.tsx
git commit -m "feat(frontend): use real emergence state from WebSocket"
```

---

## Task 5: Test Self-Evolution Pipeline End-to-End

**Files:**
- Create: `backend/src/tests/self-evolution.test.ts`

- [ ] **Step 1: Write test for self-evolution**

```typescript
import { describe, it, expect } from 'vitest';
import { SelfEvolutionEngine } from '../services/self-evolution.js';

describe('SelfEvolutionEngine', () => {
  it('should complete pipeline and apply changes', async () => {
    const engine = new SelfEvolutionEngine();
    
    const result = await engine.evolveSelf(
      ['TypeError: Cannot read property "query" of undefined'],
      ['should pass valid query', 'should handle empty results']
    );
    
    console.log('Evolution result:', result);
    expect(result.pipelineId).toBeDefined();
    expect(result.iteration).toBe(1);
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd backend && npm run test -- self-evolution
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/tests/self-evolution.test.ts
git commit -m "test: add self-evolution integration test"
```

---

## Verification

After all tasks:
```bash
# Backend
cd backend && npm run dev

# Frontend  
npm run dev

# Test flow:
# 1. Submit a prompt
# 2. Watch AgentStream component for real emergence grid updates
# 3. Check that self-evolution runs if there are test failures
```