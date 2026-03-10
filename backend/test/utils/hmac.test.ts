import { createHmac } from 'crypto';
import { verifyWebhookSignature } from '../../src/utils/hmac.js';

const MP_WEBHOOK_SECRET = 'test-secret';

function buildSignature(ts: string, dataId: string, requestId: string, secret: string): string {
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac('sha256', secret).update(template).digest('hex');
  return `ts=${ts},v1=${hash}`;
}

describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    process.env.MP_WEBHOOK_SECRET = MP_WEBHOOK_SECRET;
  });

  afterEach(() => {
    delete process.env.MP_WEBHOOK_SECRET;
  });

  it('should return true for a valid signature', () => {
    const ts = '1704067200';
    const dataId = 'payment_123';
    const requestId = 'req-uuid-here';
    const signature = buildSignature(ts, dataId, requestId, MP_WEBHOOK_SECRET);

    const result = verifyWebhookSignature({ signature, requestId, dataId });

    expect(result).toBe(true);
  });

  it('should return false for a tampered signature', () => {
    const ts = '1704067200';
    const dataId = 'payment_123';
    const requestId = 'req-uuid-here';
    const signature = `ts=${ts},v1=tampered_hash_value_that_is_wrong_aaaaaaaaaaaaaaaa`;

    const result = verifyWebhookSignature({ signature, requestId, dataId });

    expect(result).toBe(false);
  });

  it('should return false when signature is null', () => {
    const result = verifyWebhookSignature({ signature: null, requestId: 'req-id', dataId: 'data-id' });
    expect(result).toBe(false);
  });

  it('should return false when signature is undefined', () => {
    const result = verifyWebhookSignature({ signature: undefined, requestId: 'req-id', dataId: 'data-id' });
    expect(result).toBe(false);
  });

  it('should return false when requestId is null', () => {
    const signature = buildSignature('123', 'data', 'req', MP_WEBHOOK_SECRET);
    const result = verifyWebhookSignature({ signature, requestId: null, dataId: 'data-id' });
    expect(result).toBe(false);
  });

  it('should return false when requestId is undefined', () => {
    const signature = buildSignature('123', 'data', 'req', MP_WEBHOOK_SECRET);
    const result = verifyWebhookSignature({ signature, requestId: undefined, dataId: 'data-id' });
    expect(result).toBe(false);
  });

  it('should return false when dataId is null', () => {
    const signature = buildSignature('123', 'data', 'req', MP_WEBHOOK_SECRET);
    const result = verifyWebhookSignature({ signature, requestId: 'req-id', dataId: null });
    expect(result).toBe(false);
  });

  it('should return false when dataId is undefined', () => {
    const signature = buildSignature('123', 'data', 'req', MP_WEBHOOK_SECRET);
    const result = verifyWebhookSignature({ signature, requestId: 'req-id', dataId: undefined });
    expect(result).toBe(false);
  });

  it('should return false when signature has wrong ts', () => {
    const ts = '1704067200';
    const dataId = 'payment_123';
    const requestId = 'req-uuid-here';
    const signature = buildSignature(ts, dataId, requestId, MP_WEBHOOK_SECRET);
    const tamperedSignature = signature.replace(ts, '9999999999');

    const result = verifyWebhookSignature({ signature: tamperedSignature, requestId, dataId });

    expect(result).toBe(false);
  });
});
