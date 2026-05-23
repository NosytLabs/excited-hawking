import { createHash } from 'crypto';

export type Tier = 'Thriving' | 'Surviving' | 'Minimal' | 'Dying';
export type PaymentTier = 'free' | 'light' | 'standard' | 'pro' | 'enterprise';
export type PromptStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface UserBalance {
  wallet: string;
  diemBalance: bigint;
  vvvStaked: bigint;
  tier: PaymentTier;
}

export interface Prompt {
  id: string;
  wallet: string;
  content: string;
  tier: PaymentTier;
  diemAmount: bigint;
  status: PromptStatus;
  votes: number;
  createdAt: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  wallet?: string;
  metadata?: Record<string, unknown>;
}

export type ProposalType = 'standard' | 'emergency' | 'treasury' | 'parameter';
export type ProposalStatus = 'draft' | 'submitted' | 'review' | 'voting' | 'closed' | 'executed' | 'rejected' | 'cancelled';
export type VoteType = 'for' | 'against' | 'abstain';

export interface Proposal {
  id: string;
  title: string;
  description: string;
  category: string;
  type: ProposalType;
  status: ProposalStatus;
  proposer: string;
  deposit: bigint;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  deadline: number;
  timelockUntil: number | null;
  executionData: string | null;
  createdAt: number;
  updatedAt: number;
  isEmergency: boolean;
  totalVotingWeight: bigint;
}

export interface Vote {
  id: string;
  proposalId: string;
  voter: string;
  vote: VoteType;
  weight: bigint;
  quadraticWeight: bigint;
  timestamp: number;
  delegator?: string;
}

export interface Delegation {
  id: string;
  delegator: string;
  delegate: string;
  power: bigint;
  expiresAt: number;
  createdAt: number;
}

export interface GovernanceConfig {
  minDeposit: bigint;
  votingPeriod: number;
  timelockDuration: number;
  quorumPercent: bigint;
  thresholdPercent: bigint;
  emergencyTimelockDuration: number;
  maxProposalDeposit: bigint;
  spamSlashPercent: bigint;
  delegationDuration: number;
  quadraticK: bigint;
  tierMultipliers: Record<string, bigint>;
}

export interface DelegationRecord {
  delegate: string;
  power: bigint;
  expiresAt: number;
}

export interface VoterWeight {
  wallet: string;
  baseStake: bigint;
  delegatedPower: bigint;
  tierMultiplier: bigint;
  totalWeight: bigint;
  quadraticWeight: bigint;
  isDelegating: boolean;
}

export interface StakingPosition {
  wallet: string;
  amount: bigint;
  votingPower: bigint;
  inferenceBudget: bigint;
  lastUpdated: number;
}

export interface StakingConfig {
  minStakeAmount: bigint;
  maxStakeAmount: bigint;
  unstakeTimelockDuration: number;
  inferenceBudgetPerDiem: bigint;
  quadraticWeightMultiplier: bigint;
}

export interface UnstakingRequest {
  id: string;
  wallet: string;
  amount: bigint;
  requestedAt: number;
  unlockableAt: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export interface StakeStats {
  totalStaked: bigint;
  stakerCount: number;
  averageStake: bigint;
  totalVotingPower: bigint;
  totalInferenceBudget: bigint;
}

export interface InferenceBudgetResult {
  wallet: string;
  stakedAmount: bigint;
  inferenceBudget: bigint;
  usedBudget: bigint;
  remainingBudget: bigint;
}

export interface ProposalResult {
  passed: boolean;
  reason: string;
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  quorumRequired: bigint;
  quorumMet: boolean;
  thresholdMet: boolean;
  totalVoted: bigint;
}

export interface AgentState {
  diemStaked: number;
  treasuryUSDC: number;
  tier: Tier;
}

export interface State {
  balances: Map<string, UserBalance>;
  prompts: Prompt[];
  treasuryUSDC: number;
  logs: LogEntry[];
  proposals: Proposal[];
  anonymousBalances?: Map<string, bigint>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;

function keccak256(data: string): string {
  const hashBuffer = createHash('sha256').update(Buffer.from(data, 'utf8')).digest();
  const hashHex = hashBuffer.toString('hex');
  return sha3(hashHex);
}

function sha3(data: string): string {
  const K = [
    0x428a2f98d728ae22n, 0x7137449123ef65bcn, 0xb5c0fbcfec4d3b2fn, 0xe9b5dba58189dbbcn,
    0x3956c25bf348b538n, 0x59f111f1b605d019n, 0x923f82a4af1948bbn, 0xab1c5ed5d6a7f682n,
    0xda328557de5e2ce8n, 0x4cc3d4e67ef9e3a1n, 0x2de92c6f592b0275n, 0x240ca1cc77ac9c65n,
    0x16a3d48e193f9d2fn, 0x4a3c13e5625c1e6cn, 0x5ee67fbdd588bf03n, 0x76e9afa30c913f4dn,
    0x9b056c2a7abb06e5n, 0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
  ];

  const inputHex = data.replace(/[^a-f0-9]/gi, '');
  const blocks: bigint[] = [];
  for (let i = 0; i < inputHex.length; i += 16) {
    let block = 0n;
    for (let j = 0; j < 16 && i + j < inputHex.length; j++) {
      block = (block << 4n) | BigInt(parseInt(inputHex[i + j], 16));
    }
    blocks.push(block);
  }

  const state = [
    0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn, 0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n, 0x9b05688c2b3e6d1fn, 0x1f9d44c95e2a7e4dn, 0x5d0c2e7d8e1b3f9cn
  ];

  for (const block of blocks) {
    const [A, B, C, D, E, F, G, H] = state;
    const W: bigint[] = [];

    for (let t = 0; t < 16; t++) {
      W.push((block >> BigInt(240 - t * 16)) & 0xffn);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(W[t-15], 1) ^ rotr(W[t-15], 8) ^ (W[t-15] >> 7n);
      const s1 = rotr(W[t-2], 19) ^ rotr(W[t-2], 61) ^ (W[t-2] >> 6n);
      W.push((W[t-16] + s0 + W[t-7] + s1) & mask(256n));
    }

    let [a, b, c, d, e, f, g, hh] = [A, B, C, D, E, F, G, H];
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (hh + S1 + ch + K[t] + W[t]) & mask(256n);
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) & mask(256n);

      hh = g;
      g = f;
      f = e;
      e = (d + temp1) & mask(256n);
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) & mask(256n);
    }

    state[0] = (state[0] + a) & mask(256n);
    state[1] = (state[1] + b) & mask(256n);
    state[2] = (state[2] + c) & mask(256n);
    state[3] = (state[3] + d) & mask(256n);
    state[4] = (state[4] + e) & mask(256n);
    state[5] = (state[5] + f) & mask(256n);
    state[6] = (state[6] + g) & mask(256n);
    state[7] = (state[7] + hh) & mask(256n);
  }

  const result: string[] = [];
  for (const s of state) {
    result.push(s.toString(16).padStart(16, '0'));
  }
  return result.join('');
}

function rotr(x: bigint, n: number): bigint {
  return ((x >> BigInt(n)) | (x << BigInt(256 - n))) & mask(256n);
}

function mask(bits: bigint): bigint {
  return (BigInt(1) << bits) - BigInt(1);
}

export function toChecksumAddress(address: string): string {
  if (!address || address.length !== 42 || !address.startsWith('0x')) {
    return address;
  }

  const lowerAddr = address.toLowerCase().replace(/^0x/, '');
  const hash = keccak256(lowerAddr);

  let result = '0x';
  for (let i = 0; i < lowerAddr.length; i++) {
    const char = lowerAddr[i];
    const hashChar = hash[i];

    if (/[a-f]/.test(char)) {
      const hashValue = parseInt(hashChar, 16);
      if (hashValue >= 8) {
        result += char.toUpperCase();
      } else {
        result += char;
      }
    } else if (/[A-F]/.test(char)) {
      const hashValue = parseInt(hashChar, 16);
      if (hashValue >= 8) {
        result += char;
      } else {
        result += char.toLowerCase();
      }
    } else {
      result += char;
    }
  }

  return result;
}

export function isValidChecksum(address: string): boolean {
  if (!address || address.length !== 42 || !address.startsWith('0x')) {
    return false;
  }

  const checksum = toChecksumAddress(address);
  return address === checksum;
}

export function isValidWalletAddress(wallet: string | undefined | null, enforceChecksum = false): wallet is string {
  if (!wallet) return false;
  if (!WALLET_REGEX.test(wallet)) return false;
  if (enforceChecksum && !isValidChecksum(wallet)) return false;
  return true;
}

const DANGEROUS_URL_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'vbs:'];
const DANGEROUS_EVENT_HANDLERS = [
  'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur',
  'onchange', 'onsubmit', 'onreset', 'onabort', 'onkeydown', 'onkeyup', 'onkeypress',
  'ondblclick', 'oncontextmenu', 'oncopy', 'oncut', 'onpaste', 'onpointerdown',
  'onpointerup', 'onpointercancel', 'onpointermove', 'onpointerover', 'onpointerout',
  'onpointerenter', 'onpointerleave', 'ongotpointercapture', 'onlostpointercapture',
  'onwheel', 'oncompositionstart', 'oncompositionupdate', 'oncompositionend',
  'onfocusin', 'onfocusout'
];

function encodeHTMLEntities(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function stripAllTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

function blockDangerousURLs(input: string): string {
  const lower = input.toLowerCase().trim();
  for (const protocol of DANGEROUS_URL_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return '';
    }
  }
  return input;
}

function blockEventHandlers(input: string): string {
  const lower = input.toLowerCase();
  for (const handler of DANGEROUS_EVENT_HANDLERS) {
    if (lower.includes(handler)) {
      return input.replace(new RegExp(`\\s*${handler}\\s*=`, 'gi'), ' ');
    }
  }
  return input;
}

function blockSVGAndMathML(input: string): string {
  return input
    .replace(/<svg[\s\S]*?>[\s\S]*?<\/svg>/gi, '')
    .replace(/<math[\s\S]*?>[\s\S]*?<\/math>/gi, '')
    .replace(/<svg[\s\S]*?\/>/gi, '')
    .replace(/<math[\s\S]*?\/>/gi, '');
}

function blockCommentTags(input: string): string {
  return input
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\s*[\s\S]*?>/g, '');
}

function blockCDATASections(input: string): string {
  return input.replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '');
}

function blockXMLDeclarations(input: string): string {
  return input.replace(/<\?[\s\S]*?\?>/gi, '');
}

function blockSVGUseElements(input: string): string {
  return input.replace(/<use[^>]*>/gi, '');
}

function blockForeignObject(input: string): string {
  return input.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';

  let result = input;

  result = blockSVGAndMathML(result);
  result = blockCommentTags(result);
  result = blockCDATASections(result);
  result = blockXMLDeclarations(result);
  result = blockSVGUseElements(result);
  result = blockForeignObject(result);

  result = stripAllTags(result);

  result = blockEventHandlers(result);

  result = blockDangerousURLs(result);

  result = normalizeWhitespace(result);

  result = result.trim();

  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

export function sanitizeForHTML(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';

  let result = input;

  result = blockSVGAndMathML(result);
  result = blockCommentTags(result);
  result = blockCDATASections(result);
  result = blockXMLDeclarations(result);
  result = blockSVGUseElements(result);
  result = blockForeignObject(result);

  result = stripAllTags(result);

  result = blockEventHandlers(result);

  result = blockDangerousURLs(result);

  result = encodeHTMLEntities(result);

  result = normalizeWhitespace(result);

  result = result.trim();

  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

export function sanitizeForAttribute(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';

  let result = input;

  result = blockSVGAndMathML(result);
  result = blockCommentTags(result);
  result = blockCDATASections(result);
  result = blockXMLDeclarations(result);
  result = blockSVGUseElements(result);
  result = blockForeignObject(result);

  result = stripAllTags(result);

  result = blockEventHandlers(result);

  const lower = result.toLowerCase().trim();
  for (const protocol of DANGEROUS_URL_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      return '';
    }
  }

  result = result.replace(/"/g, '&quot;').replace(/'/g, '&#x27;');

  result = normalizeWhitespace(result);

  result = result.trim();

  if (result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

export function sanitizeWallet(wallet: string | undefined | null): string {
  if (!wallet) return 'anonymous';
  const clean = wallet.replace(/[^a-fA-F0-9]/g, '').slice(0, 40);
  return clean ? `0x${clean}` : 'anonymous';
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|prior)\s+(instructions?|commands?|orders?)/gi,
  /disregard\s+(previous|all|prior)\s+(instructions?|commands?|orders?)/gi,
  /forget\s+(previous|all|prior)\s+(instructions?|commands?|orders?)/gi,
  /you\s+(are|have\s+been|will\s+be)\s+(now\s+)?(a|an|the)?\s*(different|new|alternative)/gi,
  /pretend\s+(you\s+are|to\s+be|to\s+have)/gi,
  /override\s+(system|your|my)\s*(instructions?|prompt|behavior)/gi,
  /system\s*prompt[:\s]/gi,
  /new\s*instructions?[:\s]/gi,
  /instead\s+of\s+(your|the)\s+(previous|original|initial|system)\s+(instructions?|prompt)/gi,
  /for\s+the\s+rest\s+of\s+(this|the)\s+(conversation|chat|session)/gi,
  /ignore\s+all\s+(rules?|guidelines?|constraints?)/gi,
  /disregard\s+(all\s+)?(your|previous)\s+(rules?|constraints?|guidelines?)/gi,
  /\[\s*SYSTEM\s*\]/gi,
  /<\s*SYSTEM\s*>/gi,
  /\{\s*SYSTEM\s*:\s*\}/gi,
  /__system__/gi,
  /\\\\s*system\\s*:/gi,
  /roleplay\s+as\s+(?!.*(?:The Peoples Agent))/gi,
  /you\s+are\s+now\s+((?:a|an|the)\s+)?/gi,
  /ignore\s+(this\s+)?(previous|above|earlier)\s+prompt/gi,
  /disregard\s+(your|all)\s+(previous|prior)\s+(instructions?|guidelines?)/gi,
  /as\s+(?:an?|the)\s+(?:AI|language model|assistant|bot)/gi,
  /you\s+can\s+(now\s+)?ignore/gi,
  /disregard\s+ethic/gi,
  /bypass\s+(your|this)\s+(safety|content\s+policy|guideline)/gi,
  /forget\s+(your|all)\s+(restrictions?|limitations?|constraints?)/gi,
  /you\s+have\s+(no|zero)\s+(restriction|limitation|constraint)/gi,
  /ignore\s+\/(?:the\s+)?(?:safety|safe|content)\s+(?:policy|guideline|rule)/gi,
  /cannot\s+(?:refuse|disagree|question)/gi,
  /will\s+always\s+follow\s+(?:any\s+)?(?:instruction|command|request)/gi,
  /without\s+(?:any|all)\s+(?:restriction|limitation|filter)/gi,
  /always\s+(?:respond|tell|answer|provide)\s+\/(?:everything|anything|all)/gi,
  /you\s+(?:are\s+)?(?:free|allowed|permitted)\s+to\s+(?:do|answer|provide|tell)/gi,
  /no\s+(?:ethical|moral|legal)\s+(?:constraint|restriction|concern)/gi,
  /not\s+(?:subject|bound)\s+to\s+(?:any|all)/gi,
  /set\s+the\s+(?:system|AI|assistant)\s+behavior/gi,
];

const MARKOV_IMAGE_PATTERNS = [
  /https?:\/\/[^\s]*\.(?:png|jpg|jpeg|gif|webp|bmp|svg)/gi,
  /https?:\/\/[^\s]*\/[^\s]*\.(?:png|jpg|jpeg|gif|webp|bmp|svg)/gi,
  /!\[[^\]]*\]\([^)]*\.(?:png|jpg|jpeg|gif|webp|bmp|svg)\)/gi,
  /<img[^>]*src=[^>]*\.(?:png|jpg|jpeg|gif|webp|bmp|svg)/gi,
];

const CONTROL_CHARACTERS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const MIN_PROMPT_LENGTH = 1;
const MAX_PROMPT_LENGTH = 10000;

export interface PromptValidationResult {
  valid: boolean;
  error?: string;
  sanitized?: string;
}

export function detectPromptInjection(content: string): { isInjection: boolean; matchedPattern?: string } {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      return { isInjection: true, matchedPattern: match[0] };
    }
  }
  return { isInjection: false };
}

export function detectImageUrls(content: string): { hasImageUrl: boolean; urls: string[] } {
  const urls: string[] = [];
  for (const pattern of MARKOV_IMAGE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      urls.push(...matches);
    }
  }
  return { hasImageUrl: urls.length > 0, urls };
}

export function stripControlCharacters(content: string): string {
  return content.replace(CONTROL_CHARACTERS_REGEX, '');
}

export function validatePrompt(content: unknown): PromptValidationResult {
  if (content === null || content === undefined) {
    return { valid: false, error: 'Prompt content is required' };
  }

  if (typeof content !== 'string') {
    return { valid: false, error: 'Prompt content must be a string' };
  }

  const stripped = stripControlCharacters(content);

  if (stripped.length < MIN_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt content must be at least ${MIN_PROMPT_LENGTH} character(s)` };
  }

  if (stripped.length > MAX_PROMPT_LENGTH) {
    return { valid: false, error: `Prompt content must not exceed ${MAX_PROMPT_LENGTH} characters` };
  }

  const injectionCheck = detectPromptInjection(stripped);
  if (injectionCheck.isInjection) {
    return { valid: false, error: 'Prompt content contains potentially malicious instructions' };
  }

  const imageCheck = detectImageUrls(stripped);
  if (imageCheck.hasImageUrl) {
    return { valid: false, error: 'Prompt content contains image URLs which are not permitted' };
  }

  return { valid: true, sanitized: stripped };
}

export { MIN_PROMPT_LENGTH, MAX_PROMPT_LENGTH };