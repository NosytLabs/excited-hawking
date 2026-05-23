import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateNonce(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = randomUUID().split('-').join('');
  for (let i = 0; i < length; i++) {
    result += chars[parseInt(randomValues[i % randomValues.length], 16) % chars.length];
  }
  return result;
}