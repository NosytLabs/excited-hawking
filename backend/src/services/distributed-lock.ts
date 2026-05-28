import { readFileSync, writeFileSync, existsSync, unlinkSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const LOCK_DIR = join(process.cwd(), '.locks');

function ensureLockDir(): void {
  if (!existsSync(LOCK_DIR)) {
    mkdirSync(LOCK_DIR, { recursive: true });
  }
}

export interface LockResult {
  acquired: boolean;
  lockId?: string;
  expiresAt?: number;
}

function sanitizeForFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '_');
}

function hashWalletAction(wallet: string, action: string): string {
  return createHash('sha256')
    .update(`${wallet}:${action}:${Date.now()}`)
    .digest('hex')
    .slice(0, 16);
}

export async function acquireLock(
  wallet: string,
  action: string,
  ttlMs: number = 30000
): Promise<LockResult> {
  ensureLockDir();

  const sanitizedWallet = sanitizeForFilename(wallet);
  const sanitizedAction = sanitizeForFilename(action);

  if (sanitizedWallet.includes('..') || sanitizedAction.includes('..')) {
    return { acquired: false };
  }

  const lockId = hashWalletAction(wallet, action);
  const lockFile = join(LOCK_DIR, `${sanitizedWallet}:${sanitizedAction}.lock`);
  const expiresAt = Date.now() + ttlMs;

  try {
    if (existsSync(lockFile)) {
      const content = readFileSync(lockFile, 'utf-8');
      const data = JSON.parse(content);

      if (data.expiresAt > Date.now()) {
        return { acquired: false };
      }

      try {
        unlinkSync(lockFile);
      } catch {
        // another process cleaned it up
      }
    }

    const lockData = { lockId, wallet, action, expiresAt };
    writeFileSync(lockFile, JSON.stringify(lockData), { flag: 'wx' });

    return { acquired: true, lockId, expiresAt };
  } catch {
    return { acquired: false };
  }
}

export async function releaseLock(wallet: string, action: string): Promise<void> {
  const sanitizedWallet = sanitizeForFilename(wallet);
  const sanitizedAction = sanitizeForFilename(action);
  const lockFile = join(LOCK_DIR, `${sanitizedWallet}:${sanitizedAction}.lock`);

  try {
    if (existsSync(lockFile)) {
      unlinkSync(lockFile);
    }
  } catch {
    // lock already released or expired
  }
}

export async function cleanupExpiredLocks(): Promise<void> {
  ensureLockDir();
  const files = readdirSync(LOCK_DIR);

  for (const file of files) {
    if (!file.endsWith('.lock')) continue;

    try {
      const content = readFileSync(join(LOCK_DIR, file), 'utf-8');
      const data = JSON.parse(content);

      if (data.expiresAt < Date.now()) {
        unlinkSync(join(LOCK_DIR, file));
      }
    } catch {
      try {
        unlinkSync(join(LOCK_DIR, file));
      } catch {
        // file gone
      }
    }
  }
}

setInterval(cleanupExpiredLocks, 60 * 1000);
