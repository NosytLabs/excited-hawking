# The Commons Agent - Full Functional Overhaul

**Date:** 2024-XX-XX
**Status:** Design

## Overview

Make all "mocked" features actually work using existing infrastructure (Venice AI for embeddings, Node.js fs for file ops).

## Current Issues

| Feature | Current State | Problem |
|--------|---------------|---------|
| Self-Evolution | Pipeline exists, no file writes | `implementFix` returns changes without writing |
| Memvid Embeddings | Hash-based fake | `computeEmbeddingSync` is a simple hash |
| Vector Memory | ChromaDB configured | Requires external ChromaDB server |
| Conway Sync | Frontend simulates | Not connected to backend |

## Solution Architecture

### 1. Embeddings - Use Venice AI (Already Integrated)

**Change:** Replace hash-based embeddings with real Venice embeddings.

```typescript
// NEW: src/lib/real-embeddings.ts
import { veniceRequest } from './llm.js';

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await veniceRequest<{
    data: Array<{ embedding: number[] }>;
  }>('/embeddings', 'POST', {
    input: text,
    model: 'embedding'
  });
  return response.data[0]?.embedding || generateFallbackEmbedding(text);
}

function generateFallbackEmbedding(text: string): number[] {
  // Deterministic fallback using simple hash
  const hash = simpleTextHash(text);
  const dims = 384;
  const emb = new Array(dims).fill(0);
  for (let i = 0; i < dims; i++) {
    const h1 = (hash + i * 31) % 1000000;
    const h2 = (hash + i * 17) % 1000000;
    emb[i] = Math.sin(h1 / 100) * Math.cos(h2 / 100);
  }
  return normalize(emb);
}
```

**Cost:** Venice embedding API - check pricing (typically $0.10/1M tokens)

### 2. Vector Memory - SQLite + Venice (No External Server)

**Change:** Replace ChromaDB with SQLite + Venice embeddings.

```typescript
// NEW: src/lib/sqlite-vector.ts
// Uses better-sqlite3 for storage, Venice for embeddings
// Fallback to in-memory if SQLite unavailable
```

**Why:** ChromaDB requires running server at localhost:8000 - too complex for simple deployment.

### 3. Self-Evolution - Real File Operations

**Change:** `implementFix` actually writes to files.

```typescript
// MODIFY: backend/src/services/self-evolution.ts

import { writeFileSync, readFileSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function applyCodeChanges(changes: CodeChange[]): Promise<void> {
  for (const change of changes) {
    const filePath = join(process.cwd(), change.file);
    const content = readFileSync(filePath, 'utf-8');
    
    let newContent: string;
    switch (change.type) {
      case 'insert':
        const lines = content.split('\n');
        lines.splice(change.location!.line - 1, 0, change.newCode);
        newContent = lines.join('\n');
        break;
      case 'replace':
        newContent = content.replace(change.oldCode!, change.newCode);
        break;
      case 'delete':
        newContent = content.replace(change.oldCode!, '');
        break;
    }
    
    writeFileSync(filePath, newContent);
    console.log(`[EVOLUTION] Applied change to ${change.file}`);
  }
  
  // Run tests
  try {
    const { stdout } = await execAsync('npm run test', { timeout: 60000 });
    console.log('[EVOLUTION] Tests passed:', stdout);
  } catch (error) {
    console.error('[EVOLUTION] Tests failed:', error);
    throw error;
  }
}
```

### 4. Conway Sync - Backend → Frontend WebSocket

**Change:** Backend runs Conway engine, broadcasts state via WebSocket.

```typescript
// MODIFY: backend/src/lib/emergence.ts
// Add broadcast method

import { getIO } from '../services/websocket.js';

function step(): GridState {
  // ... existing logic ...
  
  // Broadcast to all subscribers
  const io = getIO();
  if (io) {
    io.to('emergence').emit('emergence:update', {
      grid: this.grid,
      generation: this.generation,
      patterns: this.detectedPatterns
    });
  }
  
  return { grid: this.grid, generation: this.generation };
}
```

### 5. Frontend - Use Real Conway State

**Change:** Replace client-side simulation with WebSocket state.

```typescript
// MODIFY: src/components/AgentStream.tsx
// Remove useEffect interval, use WebSocket for grid state

useEffect(() => {
  websocketService.on('emergence:update', (data) => {
    setGridState(data.grid);
    setGeneration(data.generation);
  });
}, []);
```

## Implementation Order

1. **Embeddings** - Foundation (Venice already in MCP server)
2. **Self-Evolution file ops** - Core agent capability
3. **Conway sync** - Visual feedback
4. **SQLite vector store** - Replace ChromaDB dependency

## File Changes Summary

| File | Action |
|------|--------|
| `backend/src/lib/real-embeddings.ts` | NEW - Venice embedding wrapper |
| `backend/src/lib/sqlite-vector.ts` | NEW - SQLite vector store |
| `backend/src/services/self-evolution.ts` | MODIFY - real file ops + test exec |
| `backend/src/lib/emergence.ts` | MODIFY - WebSocket broadcast |
| `backend/src/lib/memory-video.ts` | MODIFY - use real embeddings |
| `src/components/AgentStream.tsx` | MODIFY - use WebSocket state |
| `backend/src/routes/emergence.ts` | NEW - emergence API routes |

## Environment Variables

```env
# Already configured:
VENICE_API_KEY=xxx
VENICE_API_URL=https://api.venice.ai/api/v1

# New (optional):
USE_IN_MEMORY_VECTOR=true  # For dev without SQLite
```

## Testing

- Self-evolution: Create a failing test, run pipeline, verify fix applied
- Embeddings: Compare Venice embeddings vs fallback (should be similar semantic quality)
- Conway: Submit prompt, verify grid state appears in frontend

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Venice API cost | Use fallback embeddings, monitor usage |
| File write failures | Sandbox to backend dir only, git commit before changes |
| Test flakiness | Self-evolution only on isolated test failures |