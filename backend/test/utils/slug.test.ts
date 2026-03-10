import { generateSlug } from '../../src/utils/slug.js';

describe('generateSlug', () => {
  it('should convert accented characters to unaccented', () => {
    const result = generateSlug('Carol e André');
    expect(result).toBe('carol-e-andre');
  });

  it('should convert uppercase to lowercase', () => {
    const result = generateSlug('JOHN AND JANE');
    expect(result).toBe('john-and-jane');
  });

  it('should replace each space with a hyphen', () => {
    const result = generateSlug('João   e   Maria');
    expect(result).toBe('joao---e---maria');
  });

  it('should remove special characters', () => {
    const result = generateSlug('João & Maria!!!');
    expect(result).toBe('joao--maria');
  });

  it('should trim leading and trailing spaces', () => {
    const result = generateSlug('  Carol e André  ');
    expect(result).toBe('carol-e-andre');
  });

  it('should handle names with multiple accent types', () => {
    const result = generateSlug('Léa e Ångström');
    expect(result).toBe('lea-e-angstrom');
  });

  it('should return empty string for empty input', () => {
    const result = generateSlug('');
    expect(result).toBe('');
  });

  it('should handle name with only special chars', () => {
    const result = generateSlug('!@#$%');
    expect(result).toBe('');
  });
});
