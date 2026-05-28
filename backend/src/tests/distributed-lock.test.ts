import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { rmSync } from 'fs';
import { join } from 'path';
import { acquireLock, releaseLock } from '../services/distributed-lock.js';

const TEST_LOCK_DIR = join(process.cwd(), '.locks');

describe('distributed-lock', () => {
  beforeEach(() => {
    try {
      rmSync(TEST_LOCK_DIR, { recursive: true, force: true });
    } catch {
      // no locks dir
    }
  });

  afterEach(() => {
    try {
      rmSync(TEST_LOCK_DIR, { recursive: true, force: true });
    } catch {
      // no locks dir
    }
  });

  it('should acquire a lock for a wallet action', async () => {
    const result = await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    expect(result.acquired).toBe(true);
    expect(result.lockId).toBeDefined();
    expect(result.expiresAt).toBeGreaterThan(Date.now());
  });

  it('should reject a second lock for the same wallet action', async () => {
    const first = await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    expect(first.acquired).toBe(true);

    const second = await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    expect(second.acquired).toBe(false);
  });

  it('should allow a different action for the same wallet', async () => {
    const voteLock = await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    expect(voteLock.acquired).toBe(true);

    const createLock = await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'create');
    expect(createLock.acquired).toBe(true);
  });

  it('should release the lock allowing a new acquisition', async () => {
    await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    await releaseLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    const result = await acquireLock('0x742d35Cc6634C0532925a3b844Bc9e7595f2d123', 'vote');
    expect(result.acquired).toBe(true);
  });

  it('should reject path traversal attempts', async () => {
    const result = await acquireLock('../../../etc/passwd', 'vote');
    expect(result.acquired).toBe(true);
    const second = await acquireLock('../../../etc/passwd', 'vote');
    expect(second.acquired).toBe(false);
  });
});
