import { slugify } from '../lib/slug';

describe('slugify', () => {
  it('should convert simple names to slug', () => {
    expect(slugify('Ana e Lucas')).toBe('ana-e-lucas');
  });

  it('should remove accents', () => {
    expect(slugify('João e Maria')).toBe('joao-e-maria');
  });

  it('should remove special characters', () => {
    expect(slugify('João & Maria')).toBe('joao-maria');
  });

  it('should handle multiple spaces', () => {
    expect(slugify('Ana  e  Lucas')).toBe('ana-e-lucas');
  });

  it('should return "seu-mapa" for empty string', () => {
    expect(slugify('')).toBe('seu-mapa');
  });

  it('should return "seu-mapa" for whitespace-only string', () => {
    expect(slugify('   ')).toBe('seu-mapa');
  });

  it('should handle names with cedilla and other accents', () => {
    expect(slugify('Conceição e Renê')).toBe('conceicao-e-rene');
  });

  it('should convert to lowercase', () => {
    expect(slugify('ANA E LUCAS')).toBe('ana-e-lucas');
  });
});
