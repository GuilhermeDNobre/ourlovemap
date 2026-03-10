import { createHmac, timingSafeEqual } from 'crypto';

interface WebhookSignatureParams {
  signature: string | null | undefined;
  requestId: string | null | undefined;
  dataId: string | null | undefined;
}

export function verifyWebhookSignature({ signature, requestId, dataId }: WebhookSignatureParams): boolean {
  if (!signature || !requestId || !dataId) return false;

  const tsMatch = signature.match(/ts=([^,]+)/);
  const v1Match = signature.match(/v1=([^,]+)/);

  if (!tsMatch || !v1Match) return false;

  const ts = tsMatch[1];
  const received = v1Match[1];
  const secret = process.env.MP_WEBHOOK_SECRET ?? '';
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(template).digest('hex');

  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(received);
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}
