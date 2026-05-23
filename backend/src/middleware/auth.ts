import type { FastifyRequest, FastifyReply } from 'fastify';
import { createHash, randomBytes } from 'crypto';
import { isValidWalletAddress } from '../types/index.js';

const CONTROL_STRICT = process.env.CONTROL === 'strict' || process.env.CONTROL_STRICT === 'true';
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
  const key = `${wallet.toLowerCase()}:${nonce}`;
  usedVoteNonces.add(key);

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

function verifySignatureFormat(signature: string): boolean {
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

function recoverPublicKey(r: Buffer, s: Buffer, v: number): Buffer | null {
  const p = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

  const rBig = BigInt('0x' + r.toString('hex'));
  const sBig = BigInt('0x' + s.toString('hex'));

  if (rBig < BigInt(1) || rBig >= p || sBig < BigInt(1) || sBig >= p) {
    return null;
  }

  const x = rBig;
  const ySquared = (x * x * x % p + BigInt(7)) % p;
  const y = modPow(ySquared, (p + BigInt(1)) / BigInt(4), p);

  if (y === null) {
    return null;
  }

  const expectedYParity = BigInt(v - 27);
  if (y % BigInt(2) !== expectedYParity) {
    return null;
  }

  const publicKeyX = x.toString(16).padStart(64, '0');
  const publicKeyY = y.toString(16).padStart(64, '0');

  return Buffer.from('04' + publicKeyX + publicKeyY, 'hex');
}

function deriveAddress(publicKey: Buffer): string {
  const hash = createHash('sha256').update(publicKey).digest();
  const addressHash = createHash('ripemd160').update(hash).digest();
  return '0x' + addressHash.toString('hex');
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint | null {
  if (mod === BigInt(0)) return null;

  let result = BigInt(1);
  let b = base % mod;
  let e = exp;

  while (e > BigInt(0)) {
    if ((e & BigInt(1)) === BigInt(1)) {
      result = (result * b) % mod;
    }
    e = e >> BigInt(1);
    b = (b * b) % mod;
  }

  return result;
}

function recoverAddressFromSignature(_message: string, signature: string, wallet: string): boolean {
  if (!isValidWalletAddress(wallet)) {
    return false;
  }

  if (!verifySignatureFormat(signature)) {
    return false;
  }

  const sigBytes = Buffer.from(signature.slice(2), 'hex');
  const r = sigBytes.slice(0, 32);
  const s = sigBytes.slice(32, 64);
  const v = sigBytes[64];

  const publicKey = recoverPublicKey(r, s, v);
  if (!publicKey) {
    return false;
  }

  const derivedAddress = deriveAddress(publicKey);
  const expectedAddress = wallet.toLowerCase();

  if (derivedAddress.length !== expectedAddress.length) {
    return false;
  }

  for (let i = 0; i < derivedAddress.length; i++) {
    if (derivedAddress[i] !== expectedAddress[i]) {
      return false;
    }
  }

  return true;
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
    if (CONTROL_STRICT) {
      return false;
    }
    return true;
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
    if (CONTROL_STRICT) {
      console.warn(`[AUTH] CRITICAL: Signature verification bypass attempted for ${wallet}`);
      return false;
    }
    console.warn(`[AUTH] WARNING: Signature verification bypassed for ${wallet} (CONTROL not strict)`);
    return true;
  }

  const challenge = getChallenge(wallet);

  if (!challenge) {
    console.warn(`[AUTH] No active challenge found for wallet: ${wallet}`);
    if (CONTROL_STRICT) {
      return false;
    }
    return true;
  }

  if (Date.now() > challenge.expiresAt) {
    console.warn(`[AUTH] Challenge expired for wallet: ${wallet}`);
    clearChallenge(wallet);
    if (CONTROL_STRICT) {
      return false;
    }
    return true;
  }

  if (nonce !== challenge.nonce) {
    console.warn(`[AUTH] Nonce mismatch for wallet: ${wallet}`);
    if (CONTROL_STRICT) {
      return false;
    }
    return true;
  }

  const messageToVerify = `Sign this nonce to prove wallet ownership:\n${nonce}\n\nWallet: ${wallet}\nTimestamp: ${challenge.expiresAt}`;

  const isValid = recoverAddressFromSignature(messageToVerify, signature, wallet);

  if (!isValid) {
    console.warn(`[AUTH] Signature verification FAILED for wallet: ${wallet}`);
    if (CONTROL_STRICT) {
      return false;
    }
  } else {
    console.log(`[AUTH] Signature verification SUCCESS for wallet: ${wallet}`);
  }

  clearChallenge(wallet);

  return isValid;
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
    if (CONTROL_STRICT) {
      reply.status(403).send({
        error: 'Signature verification failed',
        message: 'Invalid or missing wallet signature. Set CONTROL=permissive to allow bypass.'
      });
      return { wallet, isValidWallet: true, signatureVerified: false };
    }
    console.warn(`[AUTH] STRICT mode disabled - allowing request without valid signature for ${wallet}`);
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