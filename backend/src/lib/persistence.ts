import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const BACKUP_FILE = path.join(DATA_DIR, 'state.backup.json');
const CORRUPT_FILE = path.join(DATA_DIR, 'state.corrupt.json');

const SAVE_INTERVAL = 30000;

let saveTimer: ReturnType<typeof setInterval> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

interface PersistedState {
  balances: [string, { wallet: string; diemBalance: string; vvvStaked: string; tier: string }][];
  anonymousBalances?: [string, string][];
  prompts: Array<{
    id: string;
    wallet: string;
    content: string;
    tier: string;
    diemAmount: string;
    status: string;
    votes: number;
    createdAt: number;
  }>;
  treasuryUSDC: number;
  logs: Array<{
    id: string;
    timestamp: number;
    level: string;
    message: string;
    wallet?: string;
    metadata?: Record<string, unknown>;
  }>;
  proposals: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    type: string;
    status: string;
    proposer: string;
    deposit: string;
    votesFor: string;
    votesAgainst: string;
    votesAbstain: string;
    deadline: number;
    timelockUntil: number | null;
    executionData: string | null;
    createdAt: number;
    updatedAt: number;
    isEmergency: boolean;
    totalVotingWeight: string;
  }>;
  votes: Array<{
    id: string;
    proposalId: string;
    voter: string;
    vote: string;
    weight: string;
    quadraticWeight: string;
    timestamp: number;
    delegator?: string;
  }>;
  delegations: Array<{
    id: string;
    delegator: string;
    delegate: string;
    power: string;
    expiresAt: number;
    createdAt: number;
  }>;
  version: number;
}

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function bigintToString(obj: unknown): unknown {
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(bigintToString);
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = bigintToString(v);
    }
    return result;
  }
  return obj;
}

function stringToBigint(obj: unknown): unknown {
  if (typeof obj === 'string') {
    if (/^\d+n?$/.test(obj)) return BigInt(obj.replace('n', ''));
  }
  if (Array.isArray(obj)) return obj.map(stringToBigint);
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = stringToBigint(v);
    }
    return result;
  }
  return obj;
}

export async function saveState(state: {
  balances: Map<string, { wallet: string; diemBalance: bigint; vvvStaked: bigint; tier: string }>;
  prompts: Array<{
    id: string; wallet: string; content: string; tier: string; diemAmount: bigint; status: string; votes: number; createdAt: number
  }>;
  treasuryUSDC: number;
  logs: Array<{
    id: string; timestamp: number; level: string; message: string; wallet?: string; metadata?: Record<string, unknown>
  }>;
  proposals: Array<{
    id: string; title: string; description: string; category: string; type: string; status: string; proposer: string;
    deposit: bigint; votesFor: bigint; votesAgainst: bigint; votesAbstain: bigint; deadline: number; timelockUntil: number | null;
    executionData: string | null; createdAt: number; updatedAt: number; isEmergency: boolean; totalVotingWeight: bigint
  }>;
  votes: Array<{
    id: string; proposalId: string; voter: string; vote: string; weight: bigint; quadraticWeight: bigint;
    timestamp: number; delegator?: string
  }>;
  delegations: Array<{
    id: string; delegator: string; delegate: string; power: bigint; expiresAt: number; createdAt: number
  }>;
  anonymousBalances?: Map<string, bigint>;
}): Promise<void> {
  ensureDataDir();

  const serialized: PersistedState = {
    balances: Array.from(state.balances.entries()).map(([k, v]) => [
      k,
      { wallet: v.wallet, diemBalance: v.diemBalance.toString(), vvvStaked: v.vvvStaked.toString(), tier: v.tier }
    ]),
    prompts: state.prompts.map(p => ({
      ...p,
      diemAmount: p.diemAmount.toString()
    })),
    treasuryUSDC: state.treasuryUSDC,
    logs: state.logs,
    proposals: state.proposals.map(p => ({
      ...p,
      deposit: p.deposit.toString(),
      votesFor: p.votesFor.toString(),
      votesAgainst: p.votesAgainst.toString(),
      votesAbstain: p.votesAbstain.toString(),
      totalVotingWeight: p.totalVotingWeight.toString()
    })),
    votes: state.votes.map(v => ({
      ...v,
      weight: v.weight.toString(),
      quadraticWeight: v.quadraticWeight.toString()
    })),
    delegations: state.delegations.map(d => ({
      ...d,
      power: d.power.toString()
    })),
    version: 1
  };

  if (state.anonymousBalances) {
    serialized.anonymousBalances = Array.from(state.anonymousBalances.entries()).map(
      ([k, v]) => [k, v.toString()] as [string, string]
    );
  }

  const json = JSON.stringify(bigintToString(serialized), null, 2);

  if (fs.existsSync(STATE_FILE)) {
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const stats = fs.statSync(BACKUP_FILE);
        const ageMs = Date.now() - stats.mtimeMs;
        if (ageMs > SAVE_INTERVAL) {
          fs.copyFileSync(STATE_FILE, BACKUP_FILE);
        }
      } else {
        fs.copyFileSync(STATE_FILE, BACKUP_FILE);
      }
    } catch {
      console.warn('[PERSISTENCE] Failed to create backup');
    }
  }

  const tempFile = path.join(DATA_DIR, 'state.tmp');
  try {
    fs.writeFileSync(tempFile, json, 'utf-8');
    fs.renameSync(tempFile, STATE_FILE);
  } catch (err) {
    console.error('[PERSISTENCE] Failed to save state:', err);
    if (fs.existsSync(tempFile)) {
      try { fs.unlinkSync(tempFile); } catch { /* ignore */ }
    }
  }
}

interface LoadedState {
  balances: Map<string, { wallet: string; diemBalance: bigint; vvvStaked: bigint; tier: string }>;
  prompts: Array<{
    id: string; wallet: string; content: string; tier: string; diemAmount: bigint; status: string; votes: number; createdAt: number
  }>;
  treasuryUSDC: number;
  logs: Array<{
    id: string; timestamp: number; level: string; message: string; wallet?: string; metadata?: Record<string, unknown>
  }>;
  proposals: Array<{
    id: string; title: string; description: string; category: string; type: string; status: string; proposer: string;
    deposit: bigint; votesFor: bigint; votesAgainst: bigint; votesAbstain: bigint; deadline: number; timelockUntil: number | null;
    executionData: string | null; createdAt: number; updatedAt: number; isEmergency: boolean; totalVotingWeight: bigint
  }>;
  votes: Array<{
    id: string; proposalId: string; voter: string; vote: string; weight: bigint; quadraticWeight: bigint;
    timestamp: number; delegator?: string
  }>;
  delegations: Array<{
    id: string; delegator: string; delegate: string; power: bigint; expiresAt: number; createdAt: number
  }>;
  anonymousBalances?: Map<string, bigint>;
}

export async function loadState(): Promise<LoadedState | null> {
  ensureDataDir();

  let filePath = STATE_FILE;
  let usedBackup = false;

  if (!fs.existsSync(STATE_FILE)) {
    if (fs.existsSync(BACKUP_FILE)) {
      filePath = BACKUP_FILE;
      usedBackup = true;
    } else {
      return null;
    }
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content) as PersistedState;
    const data = stringToBigint(parsed) as PersistedState;

    const result: LoadedState = {
      balances: new Map(data.balances.map(([k, v]) => [
        k,
        { wallet: v.wallet, diemBalance: BigInt(v.diemBalance), vvvStaked: BigInt(v.vvvStaked), tier: v.tier }
      ])),
      prompts: data.prompts.map(p => ({ ...p, diemAmount: BigInt(p.diemAmount) })) as LoadedState['prompts'],
      treasuryUSDC: data.treasuryUSDC,
      logs: data.logs as LoadedState['logs'],
      proposals: data.proposals.map(p => ({
        ...p,
        deposit: BigInt(p.deposit),
        votesFor: BigInt(p.votesFor),
        votesAgainst: BigInt(p.votesAgainst),
        votesAbstain: BigInt(p.votesAbstain),
        totalVotingWeight: BigInt(p.totalVotingWeight)
      })) as LoadedState['proposals'],
      votes: data.votes.map(v => ({
        ...v,
        weight: BigInt(v.weight),
        quadraticWeight: BigInt(v.quadraticWeight)
      })) as LoadedState['votes'],
      delegations: data.delegations.map(d => ({
        ...d,
        power: BigInt(d.power)
      })) as LoadedState['delegations']
    };

    if (data.anonymousBalances) {
      result.anonymousBalances = new Map(
        data.anonymousBalances.map(([k, v]) => [k, BigInt(v)])
      );
    }

    if (usedBackup) {
      console.warn('[PERSISTENCE] Loaded from backup - current state file missing');
    }

    console.log(`[PERSISTENCE] State loaded: ${result.balances.size} balances, ${result.prompts.length} prompts, ${result.proposals.length} proposals`);
    return result;
  } catch (err) {
    console.error('[PERSISTENCE] Failed to load state:', err);

    if (!usedBackup && fs.existsSync(BACKUP_FILE)) {
      console.warn('[PERSISTENCE] Attempting to recover from backup...');
      try {
        const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const backupData = JSON.parse(backupContent) as PersistedState;
        fs.copyFileSync(BACKUP_FILE, CORRUPT_FILE);
        console.warn(`[PERSISTENCE] Corrupted state backed up to ${CORRUPT_FILE}`);
        const data = stringToBigint(backupData) as PersistedState;
        return {
          balances: new Map(data.balances.map(([k, v]) => [
            k,
            { wallet: v.wallet, diemBalance: BigInt(v.diemBalance), vvvStaked: BigInt(v.vvvStaked), tier: v.tier }
          ])),
          prompts: data.prompts.map(p => ({ ...p, diemAmount: BigInt(p.diemAmount) })) as LoadedState['prompts'],
          treasuryUSDC: data.treasuryUSDC,
          logs: data.logs as LoadedState['logs'],
          proposals: data.proposals.map(p => ({
            ...p, deposit: BigInt(p.deposit), votesFor: BigInt(p.votesFor),
            votesAgainst: BigInt(p.votesAgainst), votesAbstain: BigInt(p.votesAbstain),
            totalVotingWeight: BigInt(p.totalVotingWeight)
          })) as LoadedState['proposals'],
          votes: data.votes.map(v => ({
            ...v, weight: BigInt(v.weight), quadraticWeight: BigInt(v.quadraticWeight)
          })) as LoadedState['votes'],
          delegations: data.delegations.map(d => ({ ...d, power: BigInt(d.power) })) as LoadedState['delegations']
        };
      } catch {
        console.error('[PERSISTENCE] Backup recovery also failed');
      }
    }

    return null;
  }
}

export function scheduleAutoSave(getState: () => unknown): void {
  if (saveTimer) clearInterval(saveTimer);

  saveTimer = setInterval(async () => {
    try {
      const state = getState() as {
        balances: Map<string, unknown>;
        prompts: unknown[];
        treasuryUSDC: number;
        logs: unknown[];
        proposals: unknown[];
        votes?: unknown[];
        delegations?: unknown[];
        anonymousBalances?: Map<string, bigint>;
      };
      await saveState(state as Parameters<typeof saveState>[0]);
      console.log('[PERSISTENCE] Auto-save completed');
    } catch (err) {
      console.error('[PERSISTENCE] Auto-save failed:', err);
    }
  }, SAVE_INTERVAL);
}

export function debouncedSave(getState: () => unknown): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const state = getState() as Parameters<typeof saveState>[0];
      await saveState(state);
    } catch (err) {
      console.error('[PERSISTENCE] Debounced save failed:', err);
    }
  }, 2000);
}

export function stopAutoSave(): void {
  if (saveTimer) {
    clearInterval(saveTimer);
    saveTimer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}