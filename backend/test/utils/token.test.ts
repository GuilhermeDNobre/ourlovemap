import { generateToken } from '../../src/utils/token.js';

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

describe('generateToken', () => {
  it('should return a string of exactly 5 characters', () => {
    const token = generateToken();
    expect(token).toHaveLength(5);
  });

  it('should only contain characters from the allowed charset', () => {
    const token = generateToken();
    for (const char of token) {
      expect(CHARSET).toContain(char);
    }
  });

  it('should rarely return the same value on consecutive calls', () => {
    const token1 = generateToken();
    const token2 = generateToken();
    const token3 = generateToken();
    const allSame = token1 === token2 && token2 === token3;
    expect(allSame).toBe(false);
  });

  it('should always return a string of 5 chars across multiple calls', () => {
    for (let i = 0; i < 20; i++) {
      const token = generateToken();
      expect(token).toHaveLength(5);
    }
  });

  it('should always use only charset characters across multiple calls', () => {
    for (let i = 0; i < 20; i++) {
      const token = generateToken();
      for (const char of token) {
        expect(CHARSET).toContain(char);
      }
    }
  });
});
