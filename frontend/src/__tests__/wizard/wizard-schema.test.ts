import { step1Schema, step2Schema, step4Schema } from '../../lib/wizard-schema';

describe('step1Schema', () => {
  const validData = {
    names: 'Ana e João',
    buyerName: 'João Silva',
    buyerPhone: '11999999999',
    startDate: '2020-01-01',
    opening: '',
  };

  it('should reject when names is empty', () => {
    const result = step1Schema.safeParse({ ...validData, names: '' });
    expect(result.success).toBe(false);
  });

  it('should reject when names has fewer than 3 characters', () => {
    const result = step1Schema.safeParse({ ...validData, names: 'AB' });
    expect(result.success).toBe(false);
  });

  it('should accept when all fields are valid', () => {
    const result = step1Schema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject when startDate is in the future', () => {
    const result = step1Schema.safeParse({ ...validData, startDate: '2099-01-01' });
    expect(result.success).toBe(false);
  });

  it('should reject when startDate is empty', () => {
    const result = step1Schema.safeParse({ ...validData, startDate: '' });
    expect(result.success).toBe(false);
  });

  it('should reject when buyerName is empty', () => {
    const result = step1Schema.safeParse({ ...validData, buyerName: '' });
    expect(result.success).toBe(false);
  });
});

describe('step2Schema', () => {
  const validPlace = {
    id: 'place-1',
    title: 'Café Central',
    address: 'Rua X',
    description: '',
    photo: null,
    latitude: -23.5,
    longitude: -46.6,
  };

  it('should reject when places array is empty', () => {
    const result = step2Schema.safeParse({ places: [] });
    expect(result.success).toBe(false);
  });

  it('should reject when place has no title', () => {
    const result = step2Schema.safeParse({
      places: [{ ...validPlace, title: '' }],
    });
    expect(result.success).toBe(false);
  });

  it('should reject when place has zero latitude', () => {
    const result = step2Schema.safeParse({
      places: [{ ...validPlace, latitude: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('should accept when place is complete with valid address', () => {
    const result = step2Schema.safeParse({ places: [validPlace] });
    expect(result.success).toBe(true);
  });
});

describe('step4Schema', () => {
  it('should reject when email format is invalid', () => {
    const result = step4Schema.safeParse({
      email: 'not-an-email',
      emailConfirm: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('should reject when emails do not match', () => {
    const result = step4Schema.safeParse({
      email: 'a@a.com',
      emailConfirm: 'b@b.com',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find((issue) =>
        issue.path.includes('emailConfirm'),
      );
      expect(confirmError?.message).toBe('Os emails não coincidem');
    }
  });

  it('should reject when email is empty', () => {
    const result = step4Schema.safeParse({ email: '', emailConfirm: '' });
    expect(result.success).toBe(false);
  });

  it('should accept when emails are valid and match', () => {
    const result = step4Schema.safeParse({
      email: 'test@example.com',
      emailConfirm: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });
});
