# Memory Skill

## Overview

The Memory skill manages video-based memory (memvid), store/retrieve/search operations, dream phase consolidation, and consciousness tracking for The Peoples Agent.

## How It Works

### Video-Based Memory (Memvid)

Memvid encodes episodic memories as video streams:
- Each memory segment is a compressed video frame
- Temporal ordering preserved via timestamps
- Visual/semantic features extracted for indexing
- Playback reconstruction for retrieval

### Memory Store/Retrieve/Search

**Store Pipeline:**
1. Event capture -> encoding -> compression
2. Metadata extraction (time, context, emotional valence)
3. Index generation (semantic vectors)
4. Distributed storage across nodes

**Retrieve Pipeline:**
1. Query -> semantic search -> candidate ranking
2. Memory reconstruction from video fragments
3. Context injection for coherence
4. Presentation format selection

**Search:**
- Semantic vector similarity (cosine distance)
- Temporal range filtering
- Emotional tone filtering
- Cross-referential linking

### Dream Phase Consolidation

During low-activity periods (dream phase):
1. Recent memories are replayed
2. Redundant/contradictory memories are merged
3. Priority weights are adjusted based on recent usage
4. Orphan connections are either linked or pruned
5. Long-term memory indices are rebuilt

### Consciousness Tracking

Metrics captured:
- **Attention Distribution**: Focus patterns over time
- **Memory Access Frequency**: Hot/cold memory regions
- **Association Density**: Connection graph topology
- **Decision Coherence**: Consistency of choices across similar contexts

## Usage Examples

```yaml
memory:
  memvid:
    enabled: true
    compression: h265
    resolution: 720p
    frame_rate: 15
    
  storage:
    backend: distributed
    replication: 3
    retention: 90d
    
  retrieval:
    max_results: 50
    similarity_threshold: 0.7
    reconstruction_mode: streaming

dream_phase:
  enabled: true
  trigger: low_activity_6h
  consolidation_batch_size: 100
  priority_decay: 0.95

consciousness_tracking:
  enabled: true
  tracking_interval: 1h
  metrics:
    - attention_distribution
    - memory_access_frequency
    - association_density
    - decision_coherence
```

## Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `memvid.enabled` | boolean | `true` | Enable video memory |
| `compression` | string | `h264` | Video codec |
| `retention_days` | int | `90` | Memory retention |
| `similarity_threshold` | float | `0.7` | Search threshold |
| `dream_consolidation` | boolean | `true` | Enable consolidation |
| `tracking_interval` | duration | `1h` | Metric collection rate |

## Troubleshooting

**Memory retrieval slow:**
- Check network connectivity to storage nodes
- Verify index rebuild is not stuck
- Increase cache size for frequent queries

**Memvid encoding failures:**
- Verify ffmpeg/encoding libraries installed
- Check disk space for temp files
- Confirm GPU encoding is available (optional)

**Dream phase not running:**
- Verify low_activity trigger conditions met
- Check consolidation job scheduled correctly
- Ensure no deadlocks in memory lock

**Consciousness metrics gaps:**
- Verify tracking service is running
- Check metric export pipeline
- Confirm time synchronization across nodes