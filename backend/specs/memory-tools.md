# Memory & Knowledge Tools Integration Plan

**Project:** The Peoples Agent  
**Date:** 2026-05-23  
**Status:** Research & Planning

---

## Executive Summary

This document outlines research and integration plans for opensource AI memory and knowledge tools that can enhance The Peoples Agent's contextual memory capabilities. Focus areas include video-based memory (Memvid), vector databases, and personal knowledge management systems.

---

## 1. Memvid - Video-Based Memory

### 1.1 Overview
**Repository:** github.com/memvid/memvid (15.6k stars)  
**License:** Apache 2.0  
**Languages:** Rust (core), Python, Node.js SDK

Memvid is a portable, serverless memory layer that packages data, embeddings, search structure, and metadata into a single `.mv2` file. It replaces complex RAG pipelines with instant retrieval.

### 1.2 How Video-Based Memory Works

Memvid v2 uses a **Smart Frame** architecture inspired by video encoding:

1. **Smart Frames**: Immutable units storing content with timestamps, checksums, and metadata
2. **Append-only timeline**: Frames are grouped for efficient compression and parallel reads
3. **No database required**: Single file contains everything (data, embeddings, indexes)
4. **Time-travel debugging**: Can rewind, replay, or branch memory states

**File Format (`.mv2`):**
```
+-------------------+
| Header (4KB)      | Magic, version, capacity
+-------------------+
| Embedded WAL      | Crash recovery (1-64MB)
+-------------------+
| Data Segments     | Compressed frames
+-------------------+
| Lex Index         | Tantivy full-text search
+-------------------+
| Vec Index         | HNSW vectors
+-------------------+
| Time Index        | Chronological ordering
+-------------------+
| TOC (Footer)      | Segment offsets
+-------------------+
```

### 1.3 Integration for Node.js Backend

**SDK Available:** `@memvid/sdk` on npm

```bash
npm install @memvid/sdk
```

**Basic Usage:**
```typescript
import { Memvid } from '@memvid/sdk';

// Create or open memory file
const mem = new Memvid('agent-memory.mv2');

// Add memories
await mem.put({
  content: 'User prefers dark mode interface',
  metadata: { type: 'preference', timestamp: Date.now() }
});
await mem.commit();

// Search memories
const results = await mem.search({
  query: 'interface preferences',
  topK: 5
});
```

**Rust Core Library:** `memvid-core` crate (2.0) with feature flags:
- `lex` - Full-text search with BM25
- `vec` - Vector similarity (HNSW + local ONNX embeddings)
- `clip` - CLIP visual embeddings
- `whisper` - Audio transcription
- `api_embed` - OpenAI embeddings

### 1.4 Storing Agent Memories as MP4

**Current Status:** Memvid v2 uses `.mv2` format (not MP4) for its internal structure.

**Historical Note:** Memvid v1 used QR codes encoded in video frames. This approach is **deprecated**.

**For MP4-like Storage:**
- Memvid's frame-based architecture achieves similar goals
- `.mv2` files can be shared/transferred like MP4 files
- If true MP4 is required, custom implementation would need QR encoding approach from v1

**Recommendation:** Use `.mv2` format directly - it's optimized for memory storage and provides better compression than video encoding.

### 1.5 Memvid-RS (Rust Version)

**Repository:** github.com/AllenDang/memvid-rs (58 stars)  
**Status:** Community reimplementation of v1 (QR-based)

**Compatibility Issues:**
- This is a separate implementation, not an official Rust version
- Uses QR-code-in-video approach (deprecated in main memvid)
- Limited documentation and maintenance
- Not recommended for production use

**Official Rust Support:** Use `memvid-core` crate directly from the main repository (memvid/memvid)

---

## 2. Alternative Tools Research

### 2.1 Vector Databases Comparison

| Database | Stars | Language | Strengths | Weaknesses |
|----------|-------|----------|----------|-------------|
| **Milvus** | 35k+ | Go/C++ | Billion-scale, most established | Higher resource usage |
| **Qdrant** | 9k+ | Rust | Fast, cost-effective, dynamic sharding | Less mature than Milvus |
| **Chroma** | 12k+ | Python | Easiest setup, great for prototypes | Limited scalability |
| **Weaviate** | 9k+ | Go | Built-in modules, multi-modal | Complex configuration |
| **Faiss** | 30k+ | C++/Python | Meta's library, very fast | No native persistence |

**Recommendations for The Peoples Agent:**

1. **Development/Prototype:** Chroma (easiest to integrate)
2. **Production (low-cost):** Qdrant (Rust-based, efficient)
3. **High Scale:** Milvus (most mature, handles billions)

### 2.2 Personal Knowledge Management (PKM) Alternatives

| Tool | Type | License | Notes |
|------|------|---------|-------|
| **Obsidian** | Local-first | Commercial | Markdown-based, powerful linking |
| **Logseq** | Local-first | Open-source | Similar to Roam, outliner-based |
| **Foam** | VS Code extension | Open-source | Lightweight, Git-based |
| **Dendron** | VS Code extension | Open-source | Hierarchical, Markdown-based |
| **Reor** | AI-native | Open-source | Local-first, AI-powered |

**For Agent Integration:** Consider:
- **Obsidian:** Mature ecosystem, extensive plugin support
- **Logseq:** Open-source, native outliner format
- **Reor:** AI-native, designed for LLM usage

### 2.3 Brain.fm Alternatives

| Tool | Type | Notes |
|------|------|-------|
| **Noisli** | SaaS | Background sounds, not AI-generated |
| **focus.fm** | SaaS | AI-generated focus music |
| **Pzizz** | SaaS | Optimized sleep/focus sounds |
| **YouTube Focus Music** | Free | Hit or miss quality |
| **Lofi Girl** | YouTube/Free | Popular lo-fi streams |
| **endel** | SaaS | AI-generated ambient sounds |

**Note:** Brain.fm has no free/opensource alternative with equivalent AI-generated focus music. Most alternatives are either:
1. Pre-recorded music (Lofi Girl, YouTube)
2. Generic ambient sounds (Noisli)
3. Paid AI services

---

## 3. Integration Recommendations

### 3.1 Recommended Architecture

```
┌─────────────────────────────────────────────────────┐
│                  The Peoples Agent                  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Short-term  │  │ Long-term    │  │ Working  │  │
│  │ Memory      │→ │ Memory       │→ │ Memory    │  │
│  │ (In-Memory) │  │ (Memvid/Vec) │  │ (Context) │  │
│  └─────────────┘  └──────────────┘  └───────────┘  │
│         ↓               ↓               ↓         │
│  ┌─────────────────────────────────────────────┐  │
│  │     Memory Consolidation ("Dream" Phase)     │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 3.2 Implementation Priority

| Priority | Tool | Reason |
|----------|------|--------|
| **HIGH** | Memvid | Single-file, no DB, excellent for agents |
| **HIGH** | Qdrant | Production-grade vector search |
| **MEDIUM** | Chroma | Quick prototyping, easy setup |
| **LOW** | Obsidian/Logseq | Would require plugin development |

### 3.3 Cost Analysis

| Solution | Infrastructure Cost | Complexity | Best For |
|----------|---------------------|------------|----------|
| Memvid | $0 (file-based) | Low | Portable agent memory |
| Qdrant (self-hosted) | $0-$50/month | Medium | Vector search at scale |
| Chroma (embedded) | $0 | Low | Development/prototype |
| Pinecone (managed) | $70+/month | Low | Production without ops |

---

## 4. Memory Consolidation Strategy

### 4.1 "Dream" Phase Architecture

During idle/low-activity periods, the agent performs memory consolidation:

1. **Short-term → Long-term Transfer**
   - Identify important memories from short-term store
   - Compress and embed for long-term storage (Memvid)

2. **Memory Replay & Association**
   - Search related memories
   - Build associative links between memory clusters

3. **Forgetting/Summarization**
   - Compress old, rarely-accessed memories
   - Keep essential facts, discard redundant details

4. **Pattern Recognition**
   - Identify recurring themes
   - Form generalized knowledge from specific experiences

### 4.2 Implementation Approach

```typescript
interface DreamPhaseConfig {
  enabled: boolean;
  minIdleMinutes: number;
  consolidationStrength: 'light' | 'medium' | 'deep';
  compressionRatio: number;  // How much to compress old memories
}
```

---

## 5. Next Steps

### Phase 1: Core Memory Service
- [x] Create memory-video.ts interface
- [ ] Implement Memvid SDK wrapper
- [ ] Add basic CRUD operations
- [ ] Implement similarity search

### Phase 2: Memory Consolidation
- [ ] Design "dream" phase algorithm
- [ ] Implement memory prioritization
- [ ] Add compression/summarization

### Phase 3: Advanced Features
- [ ] Multi-modal memory (images, audio)
- [ ] Distributed memory (multiple agents)
- [ ] Memory versioning and branching

---

## References

- Memvid Docs: https://docs.memvid.com
- Memvid Core (Rust): https://crates.io/crates/memvid-core
- Node.js SDK: https://www.npmjs.com/package/@memvid/sdk
- Qdrant: https://github.com/qdrant/qdrant
- Chroma: https://github.com/chroma-core/chroma

---

*Vault-Tec is not responsible for any memory leaks, temporal paradoxes, or existential crises arising from AI memory implementation.*