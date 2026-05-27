import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('persistence helpers', () => {
  let originalCwd: string;
  let tempDir: string;

  beforeEach(() => {
    vi.resetModules();
    originalCwd = process.cwd();
    tempDir = mkdtempSync(path.join(tmpdir(), 'vault-persistence-'));
    process.chdir(tempDir);
    mkdirSync(path.join(tempDir, 'data'));
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
    vi.resetModules();
  });

  it('returns null when the data directory exists but no state file is present', async () => {
    const { loadState } = await import('../lib/persistence.js');

    await expect(loadState()).resolves.toBeNull();
  });

  it('saves state into an existing data directory without crashing', async () => {
    const { saveState } = await import('../lib/persistence.js');
    const state = {
      balances: new Map([
        ['wallet-1', { wallet: 'wallet-1', diemBalance: 10n, vvvStaked: 5n, tier: 'Minimal' }],
      ]),
      prompts: [],
      treasuryUSDC: 0,
      logs: [],
      proposals: [],
      votes: [],
      delegations: [],
    };

    await expect(saveState(state)).resolves.toBeUndefined();
    await new Promise(resolve => setTimeout(resolve, 0));

    const stateFile = path.join(tempDir, 'data', 'state.json');
    expect(existsSync(stateFile)).toBe(true);

    const saved = JSON.parse(readFileSync(stateFile, 'utf-8')) as {
      balances: [string, { diemBalance: string; vvvStaked: string; tier: string }][];
    };
    expect(saved.balances).toEqual([
      ['wallet-1', { wallet: 'wallet-1', diemBalance: '10', vvvStaked: '5', tier: 'Minimal' }],
    ]);
  });
});
