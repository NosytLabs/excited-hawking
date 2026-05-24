import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomBytes } from 'crypto';
import { isValidWalletAddress } from '../types/index.js';
import createKeccakHash from 'keccak';

const SIGNATURE_LENGTH = 132;
const NONCE_BYTES = 32;

export interface AuthContext {
  wallet: string;
  isValidWallet: boolean;
  signatureVerified?: boolean;
}

export interface ChallengeData {
  nonce: string;
  expiresAt: number;
}

const activeChallenges = new Map<string, ChallengeData>();
const usedVoteNonces = new Set<string>();

function cleanupExpiredChallenges(): void {
  const now = Date.now();
  for (const [key, data] of activeChallenges.entries()) {
    if (data.expiresAt < now) {
      activeChallenges.delete(key);
    }
  }
}

export function createVoteNonce(wallet: string): { nonce: string; expiresAt: number } | null {
  if (!isValidWalletAddress(wallet)) {
    return null;
  }

  const nonce = randomBytes(NONCE_BYTES).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000;

  return { nonce, expiresAt };
}

export function verifyVoteNonce(wallet: string, nonce: string): boolean {
  const key = `${wallet.toLowerCase()}:${nonce}`;
  return usedVoteNonces.delete(key);
}

export function createChallenge(wallet: string): { nonce: string; expiresAt: number } | null {
  if (!isValidWalletAddress(wallet)) {
    return null;
  }

  cleanupExpiredChallenges();

  const nonce = randomBytes(NONCE_BYTES).toString('hex');
  const expiresAt = Date.now() + 5 * 60 * 1000;

  activeChallenges.set(wallet.toLowerCase(), { nonce, expiresAt });

  return { nonce, expiresAt };
}

export function getChallenge(wallet: string): ChallengeData | undefined {
  return activeChallenges.get(wallet.toLowerCase());
}

export function clearChallenge(wallet: string): void {
  activeChallenges.delete(wallet.toLowerCase());
}

export function verifySignatureFormat(signature: string): boolean {
  if (!signature || signature.length !== SIGNATURE_LENGTH) {
    return false;
  }

  if (!signature.startsWith('0x')) {
    return false;
  }

  const hexPart = signature.slice(2);
  if (!/^[a-fA-F0-9]+$/.test(hexPart)) {
    return false;
  }

  const sigBytes = Buffer.from(hexPart, 'hex');
  if (sigBytes.length !== 65) {
    return false;
  }

  const v = sigBytes[64];
  if (v !== 27 && v !== 28) {
    return false;
  }

  return true;
}

const SECP256K1_P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
const SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
const SECP256K1_GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n;
const SECP256K1_GY = 0x483ADA7726A9C465ECBB4CB10B4A8112C80B4E5C3D6832250C5DC3B112EC9B3En;

function modPow(base: bigint, exp: bigint, mod: bigint): bigint | null {
  if (mod === 0n) return null;
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      result = (result * b) % mod;
    }
    e >>= 1n;
    b = (b * b) % mod;
  }
  return result;
}

function pointAdd(P: { x: bigint; y: bigint } | null, Q: { x: bigint; y: bigint } | null): { x: bigint; y: bigint } | null {
  if (P === null) return Q;
  if (Q === null) return P;
  if (P.x === Q.x) {
    if ((P.y + Q.y) % SECP256K1_P === 0n) return null;
    return pointDouble(P);
  }
  const num = ((Q.y - P.y) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  const den = ((Q.x - P.x) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  const lam = (num * modPow(den, SECP256K1_P - 2n, SECP256K1_P)!) % SECP256K1_P;
  const x3 = (((lam * lam) % SECP256K1_P - P.x - Q.x) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  const y3 = ((lam * (P.x - x3) - P.y) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  return { x: x3, y: y3 };
}

function pointDouble(P: { x: bigint; y: bigint }): { x: bigint; y: bigint } | null {
  if (P.y === 0n) return null;
  const num = (3n * P.x * P.x) % SECP256K1_P;
  const den = (2n * P.y) % SECP256K1_P;
  const lam = (num * modPow(den, SECP256K1_P - 2n, SECP256K1_P)!) % SECP256K1_P;
  const x3 = (((lam * lam) % SECP256K1_P - 2n * P.x) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  const y3 = ((lam * (P.x - x3) - P.y) % SECP256K1_P + SECP256K1_P) % SECP256K1_P;
  return { x: x3, y: y3 };
}

function pointMul(k: bigint, P: { x: bigint; y: bigint }): { x: bigint; y: bigint } | null {
  let result: { x: bigint; y: bigint } | null = null;
  let addend: { x: bigint; y: bigint } | null = { x: P.x, y: P.y };
  let scalar = ((k % SECP256K1_N) + SECP256K1_N) % SECP256K1_N;
  while (scalar > 0n) {
    if (scalar & 1n) {
      result = pointAdd(result, addend);
    }
    addend = pointDouble(addend!);
    scalar >>= 1n;
  }
  return result;
}

function recoverPublicKey(messageHash: Buffer, r: Buffer, s: Buffer, v: number): Buffer | null {
  const rBig = BigInt('0x' + r.toString('hex'));
  const sBig = BigInt('0x' + s.toString('hex'));
  const e = BigInt('0x' + messageHash.toString('hex'));

  if (rBig < 1n || rBig >= SECP256K1_N || sBig < 1n || sBig >= SECP256K1_N) {
    return null;
  }

  const x = rBig;
  const ySquared = (x * x * x + 7n) % SECP256K1_P;

  let y = modPow(ySquared, (SECP256K1_P + 1n) / 4n, SECP256K1_P);
  if (y === null) return null;

  const yParity = BigInt(v - 27);
  if ((y & 1n) !== yParity) {
    y = SECP256K1_P - y;
  }

  const R = { x, y };
  const rInv = modPow(rBig, SECP256K1_N - 2n, SECP256K1_N);
  if (rInv === null) return null;

  const sR = pointMul(sBig, R);
  const eG = pointMul(e, { x: SECP256K1_GX, y: SECP256K1_GY });
  if (!sR || !eG) return null;

  const negEG = { x: eG.x, y: (SECP256K1_P - eG.y) % SECP256K1_P };
  const sRminusEG = pointAdd(sR, negEG);
  if (!sRminusEG) return null;

  const Q = pointMul(rInv, sRminusEG);
  if (!Q) return null;

  return Buffer.concat([
    Buffer.from([0x04]),
    Buffer.from(Q.x.toString(16).padStart(64, '0'), 'hex'),
    Buffer.from(Q.y.toString(16).padStart(64, '0'), 'hex')
  ]);
}

function publicKeyToAddress(publicKey: Buffer): string {
  const hash = createKeccakHash('keccak256').update(publicKey.subarray(1)).digest();
  return '0x' + hash.subarray(-20).toString('hex');
}

function recoverAddressFromSignature(message: string, signature: string, wallet: string): boolean {
  if (!isValidWalletAddress(wallet)) {
    return false;
  }

  if (!verifySignatureFormat(signature)) {
    return false;
  }

  const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
  const messageHash = createKeccakHash('keccak256')
    .update(Buffer.from(prefix, 'utf8'))
    .update(Buffer.from(message, 'utf8'))
    .digest();

  const sigBytes = Buffer.from(signature.slice(2), 'hex');
  const r = sigBytes.subarray(0, 32);
  const s = sigBytes.subarray(32, 64);
  const v = sigBytes[64];

  const publicKey = recoverPublicKey(messageHash, r, s, v);
  if (!publicKey) {
    return false;
  }

  const derivedAddress = publicKeyToAddress(publicKey);
  return derivedAddress.toLowerCase() === wallet.toLowerCase();
}

export function verifyMessageSignature(
  address: string,
  signature: string | undefined,
  message: string | undefined
): boolean {
  if (!isValidWalletAddress(address)) {
    return false;
  }

  if (!signature || !message) {
    return false;
  }

  const sigValidation = verifySignatureFormat(signature);
  if (!sigValidation) {
    return false;
  }

  return recoverAddressFromSignature(message, signature, address);
}

export function verifyChallenge(
  wallet: string,
  signature: string | undefined,
  nonce: string | undefined
): boolean {
  if (!isValidWalletAddress(wallet)) {
    return false;
  }

  if (!nonce || !signature) {
    console.warn(`[AUTH] CRITICAL: Signature verification bypass attempted for ${wallet}`);
    return false;
  }

  const challenge = getChallenge(wallet);

  if (!challenge) {
    console.warn(`[AUTH] No active challenge found for wallet: ${wallet}`);
    return false;
  }

  if (Date.now() > challenge.expiresAt) {
    console.warn(`[AUTH] Challenge expired for wallet: ${wallet}`);
    clearChallenge(wallet);
    return false;
  }

  if (nonce !== challenge.nonce) {
    console.warn(`[AUTH] Nonce mismatch for wallet: ${wallet}`);
    return false;
  }

  const messageToVerify = `Sign this nonce to prove wallet ownership:\n${nonce}\n\nWallet: ${wallet}\nTimestamp: ${challenge.expiresAt}`;

  const isValid = recoverAddressFromSignature(messageToVerify, signature, wallet);

  if (!isValid) {
    console.warn(`[AUTH] Signature verification FAILED for wallet: ${wallet}`);
    clearChallenge(wallet);
    return false;
  }

  console.log(`[AUTH] Signature verification SUCCESS for wallet: ${wallet}`);
  clearChallenge(wallet);
  return true;
}

export function verifyWalletSignature(
  wallet: string,
  signature: string | undefined,
  nonce: string | undefined
): boolean {
  return verifyChallenge(wallet, signature, nonce);
}

export function getWalletFromRequest(request: FastifyRequest): string {
  const wallet = request.headers['x-wallet-address'] as string | undefined;
  return wallet || 'anonymous';
}

export function requireWallet(request: FastifyRequest, reply: FastifyReply): AuthContext {
  const wallet = request.headers['x-wallet-address'] as string | undefined;

  if (!wallet) {
    reply.status(401).send({ error: 'Wallet address required' });
    return { wallet: 'anonymous', isValidWallet: false };
  }

  return {
    wallet,
    isValidWallet: isValidWalletAddress(wallet)
  };
}

export function requireWalletWithSignature(
  request: FastifyRequest,
  reply: FastifyReply
): AuthContext {
  const wallet = request.headers['x-wallet-address'] as string | undefined;
  const signature = request.headers['x-signature'] as string | undefined;
  const nonce = request.headers['x-nonce'] as string | undefined;

  if (!wallet) {
    reply.status(401).send({ error: 'Wallet address required' });
    return { wallet: 'anonymous', isValidWallet: false };
  }

  if (!isValidWalletAddress(wallet)) {
    reply.status(400).send({ error: 'Invalid wallet address format' });
    return { wallet, isValidWallet: false };
  }

  const signatureVerified = verifyChallenge(wallet, signature, nonce);

  if (!signatureVerified) {
    reply.status(403).send({
      error: 'Signature verification failed',
      message: 'Invalid or missing wallet signature.'
    });
    return { wallet, isValidWallet: true, signatureVerified: false };
  }

  return {
    wallet,
    isValidWallet: isValidWalletAddress(wallet),
    signatureVerified
  };
}

export function optionalWalletAuth(request: FastifyRequest): AuthContext {
  const wallet = request.headers['x-wallet-address'] as string | undefined;

  if (!wallet) {
    return { wallet: 'anonymous', isValidWallet: false };
  }

  return {
    wallet,
    isValidWallet: isValidWalletAddress(wallet)
  };
}

export function optionalWalletWithSignature(request: FastifyRequest): AuthContext {
  const wallet = request.headers['x-wallet-address'] as string | undefined;
  const signature = request.headers['x-signature'] as string | undefined;
  const nonce = request.headers['x-nonce'] as string | undefined;

  if (!wallet) {
    return { wallet: 'anonymous', isValidWallet: false };
  }

  if (!isValidWalletAddress(wallet)) {
    return { wallet: 'anonymous', isValidWallet: false };
  }

  const signatureVerified = verifyChallenge(wallet, signature, nonce);

  return {
    wallet,
    isValidWallet: isValidWalletAddress(wallet),
    signatureVerified
  };
}
