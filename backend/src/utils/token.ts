import { randomBytes } from 'crypto';

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const TOKEN_LENGTH = 5;

export function generateToken(): string {
  const bytes = randomBytes(TOKEN_LENGTH);
  return Array.from(bytes)
    .map(byte => CHARSET[byte % CHARSET.length])
    .join('');
}
