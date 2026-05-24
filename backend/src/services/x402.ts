import type { FastifyRequest } from 'fastify';
import { getStakedBalance, getInferenceBudget } from './staking.js';
import { isValidWalletAddress } from '../types/index.js';
import { verifyMessageSignature, verifySignatureFormat } from '../middleware/auth.js';

export interface X402Payment {
  version: string;
  scheme: string;
  currency: string;
  amount: string;
  signature?: string;
}

export function parseX402Header(authHeader: string | undefined): X402Payment | null {
  if (!authHeader || !authHeader.startsWith('x402 ')) return null;

  const parts = authHeader.slice(5).split(':');
  if (parts.length !== 2) return null;

  const [currency, amount] = parts;
  return {
    version: '1',
    scheme: 'erc20',
    currency,
    amount
  };
}

export function validateWallet(wallet: string | undefined | null): { valid: boolean; error?: string } {
  if (!wallet) {
    return { valid: false, error: 'Wallet address is required' };
  }

  if (!wallet.startsWith('0x')) {
    return { valid: false, error: 'Wallet address must start with 0x' };
  }

  if (wallet.length !== 42) {
    return { valid: false, error: 'Wallet address must be 42 characters (including 0x prefix)' };
  }

  const hexPart = wallet.slice(2);
  if (!/^[a-fA-F0-9]{40}$/.test(hexPart)) {
    return { valid: false, error: 'Wallet address must be 40 hex characters after 0x prefix' };
  }

  if (!isValidWalletAddress(wallet)) {
    return { valid: false, error: 'Invalid wallet address checksum' };
  }

  return { valid: true };
}

function validateSignaturePattern(signature: string | undefined): { valid: boolean; error?: string } {
  if (!signature) {
    return { valid: false, error: 'Signature is required for payment validation' };
  }

  if (!verifySignatureFormat(signature)) {
    return { valid: false, error: 'Invalid signature format' };
  }

  return { valid: true };
}

function verifySignature(wallet: string, signature: string, message: string): boolean {
  return verifyMessageSignature(wallet, signature, message);
}

export async function validatePayment(
  request: FastifyRequest,
  requiredAmount: bigint
): Promise<{ valid: boolean; error?: string; payment?: X402Payment }> {
  const authHeader = request.headers.authorization;
  const signature = request.headers['x-signature'] as string | undefined;
  const message = request.headers['x-message'] as string | undefined;
  const wallet = request.headers['x-wallet-address'] as string | undefined;

  const payment = parseX402Header(authHeader);

  if (!payment) {
    return { valid: false, error: 'Missing or invalid x402 header' };
  }

  if (!authHeader || authHeader.length > 200) {
    return { valid: false, error: 'Authorization header too long' };
  }

  let amount: bigint;
  try {
    amount = BigInt(payment.amount);
  } catch {
    return { valid: false, error: 'Invalid payment amount format' };
  }

  if (amount < 0n) {
    return { valid: false, error: 'Payment amount cannot be negative' };
  }

  if (amount < requiredAmount) {
    return {
      valid: false,
      error: `Insufficient payment: ${payment.currency} ${amount} < ${requiredAmount}`
    };
  }

  if (signature && message && wallet) {
    const sigValidation = validateSignaturePattern(signature);
    if (!sigValidation.valid) {
      return { valid: false, error: `Signature validation failed: ${sigValidation.error}` };
    }

    const isValidSignature = verifySignature(wallet, signature, message);
    if (!isValidSignature) {
      return { valid: false, error: 'Signature verification failed: signature does not match wallet' };
    }
  }

  return { valid: true, payment };
}

export function validateDiemPayment(
  wallet: string,
  requiredAmount: bigint
): { valid: boolean; error?: string; payment?: { stakedAmount: bigint; inferenceBudget: bigint } } {
  const stakedBalance = getStakedBalance(wallet);

  if (stakedBalance < requiredAmount) {
    return {
      valid: false,
      error: `Insufficient staked DIEM: ${stakedBalance} < ${requiredAmount}`
    };
  }

  return {
    valid: true,
    payment: {
      stakedAmount: stakedBalance,
      inferenceBudget: getInferenceBudget(wallet)
    }
  };
}

export function getPaymentAmount(text: string): bigint {
  const baseCost = 1000000n;
  const lengthCost = BigInt(Math.floor(text.length * 500));
  return baseCost + lengthCost;
}

export const TIER_COSTS: Record<string, bigint> = {
  free: 0n,
  light: 1000000n,
  standard: 10000000n,
  pro: 50000000n,
  enterprise: 500000000n
};

export function calculateApiCallCost(tokens: bigint): bigint {
  const costPerToken = 100n;
  return tokens * costPerToken;
}

export function deductInferenceBudget(
  wallet: string,
  amount: bigint
): { success: boolean; remainingBudget: bigint; error?: string } {
  const budget = getInferenceBudget(wallet);

  if (budget < amount) {
    return {
      success: false,
      remainingBudget: budget,
      error: `Insufficient inference budget: ${budget} < ${amount}`
    };
  }

  return {
    success: true,
    remainingBudget: budget - amount
  };
}

export function getWalletBudgetInfo(wallet: string): {
  wallet: string;
  stakedAmount: bigint;
  totalBudget: bigint;
  usedBudget: bigint;
  remainingBudget: bigint;
} {
  const stakedAmount = getStakedBalance(wallet);
  const totalBudget = getInferenceBudget(wallet);

  return {
    wallet,
    stakedAmount,
    totalBudget,
    usedBudget: 0n,
    remainingBudget: totalBudget
  };
}