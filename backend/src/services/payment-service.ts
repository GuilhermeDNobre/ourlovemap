import axios from 'axios';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyBaseLogger } from 'fastify';
import {
  getMapByOrderNsu,
  activateMap,
  updatePaymentData,
  type Plan,
} from './map-service.js';
import { generateQrCode } from './qr-code-service.js';
import { sendDeliveryEmail } from './email-service.js';

const INFINITEPAY_CHECKOUT_URL = 'https://api.infinitepay.io/invoices/public/checkout/links';

const PLAN_PRICES_CENTS: Record<Plan, number> = {
  basic: 1990,
  premium: 2990,
  test: 100,
};

export interface CreateCheckoutPaymentParams {
  mapId: string;
  plan: Plan;
  email: string;
  buyerName: string;
  buyerPhone: string;
}

export interface CheckoutPaymentResult {
  checkoutUrl: string;
}

export interface InfinitePayWebhookEvent {
  invoice_slug: string;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: 'credit_card' | 'pix';
  transaction_nsu: string;
  order_nsu: string;
  receipt_url: string;
  items: Array<{ quantity: number; price: number; description: string }>;
}

export async function createCheckoutPayment(
  params: CreateCheckoutPaymentParams,
  supabase: SupabaseClient,
): Promise<CheckoutPaymentResult> {
  const price = PLAN_PRICES_CENTS[params.plan];
  const webhookUrl = `${process.env.OURLOVEMAP_API_URL}/api/payments/webhook?secret=${process.env.INFINITEPAY_WEBHOOK_SECRET}`;
  let response: { data: { url: string } };
  try {
    response = await axios.post<{ url: string }>(INFINITEPAY_CHECKOUT_URL, {
      handle: process.env.INFINITEPAY_HANDLE,
      order_nsu: params.mapId,
      items: [
        {
          quantity: 1,
          price,
          description: `Our Love Map — plano ${params.plan}`,
        },
      ],
      webhook_url: webhookUrl,
      customer: { name: params.buyerName, email: params.email, phone_number: params.buyerPhone },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`InfinitePay checkout creation failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
  const checkoutUrl = response.data.url;
  await updatePaymentData(params.mapId, { checkoutUrl }, supabase);
  return { checkoutUrl };
}

export interface WebhookProcessResult {
  wasActivated: boolean;
  plan?: Plan;
  mapId?: string;
}

export async function processWebhookEvent(
  event: InfinitePayWebhookEvent,
  supabase: SupabaseClient,
  log: FastifyBaseLogger,
): Promise<WebhookProcessResult> {
  const map = await getMapByOrderNsu(event.order_nsu, supabase);
  if (!map) {
    log.warn({ orderNsu: event.order_nsu }, 'Map not found for webhook event');
    return { wasActivated: false };
  }
  if (map.status === 'active') {
    log.warn({ mapId: map.id }, 'Webhook event ignored: map already active');
    return { wasActivated: false };
  }
  const activatedMap = await activateMap(map.id, supabase);
  if (!activatedMap.token) {
    log.error({ mapId: map.id }, 'Activated map has no token');
    return { wasActivated: true, plan: map.plan, mapId: map.id };
  }
  try {
    const qrBuffer = await generateQrCode({ slug: activatedMap.slug, token: activatedMap.token });
    await sendDeliveryEmail(
      { coupleName: activatedMap.coupleName, slug: activatedMap.slug, token: activatedMap.token, qrCodeBuffer: qrBuffer },
      activatedMap.email,
    );
  } catch (error) {
    log.error({ mapId: map.id, error: error instanceof Error ? error.message : error }, 'Failed to send delivery email');
  }
  return { wasActivated: true, plan: map.plan, mapId: map.id };
}
