import axios from 'axios';
import type { FastifyBaseLogger } from 'fastify';
import {
  getMapById,
  getMapByPaymentId,
  activateMap,
  updatePaymentData,
  type Plan,
  type MapRecord,
} from './map-service.js';
import { generateQrCode } from './qr-code-service.js';
import { sendDeliveryEmail } from './email-service.js';

const ABACATEPAY_API_URL = 'https://api.abacatepay.com';
const PIX_EXPIRY_SECONDS = 10 * 60;

const PLAN_PRICES_CENTS: Record<Plan, number> = {
  basic: 1990,
  premium: 2990,
};

function buildAuthHeaders() {
  return {
    Authorization: `Bearer ${process.env.ABACATEPAY_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export interface CreatePixPaymentParams {
  mapId: string;
  plan: Plan;
}

export interface PixPaymentResult {
  brCode: string;
  brCodeBase64: string;
  expiresAt: string;
}

export interface CreateCardPaymentParams {
  mapId: string;
  plan: Plan;
  email: string;
  buyerName: string;
  buyerPhone: string;
  taxId: string;
}

export interface CardPaymentResult {
  checkoutUrl: string;
}

export interface AbacatePayBillingProduct {
  id: string;
  externalId: string;
  quantity: number;
}

export interface AbacatePayWebhookEvent {
  event: string;
  data: {
    id?: string;
    amount?: number;
    status?: string;
    devMode?: boolean;
    url?: string;
    products?: AbacatePayBillingProduct[];
  };
}

export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  const price = PLAN_PRICES_CENTS[params.plan];
  let response: { data: { data: { id: string; brCode: string; brCodeBase64: string; expiresAt: string }; error: string | null } };
  try {
    response = await axios.post<{ data: { id: string; brCode: string; brCodeBase64: string; expiresAt: string }; error: string | null }>(
      `${ABACATEPAY_API_URL}/v1/pixQrCode/create`,
      {
        amount: price,
        expiresIn: PIX_EXPIRY_SECONDS,
        description: `Our Love Map — plano ${params.plan}`,
      },
      { headers: buildAuthHeaders() },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AbacatePay PIX creation failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
  const { id: paymentId, brCode, brCodeBase64, expiresAt } = response.data.data;
  await updatePaymentData(params.mapId, { paymentId, checkoutUrl: null });
  return { brCode, brCodeBase64, expiresAt };
}

export async function createCardPayment(params: CreateCardPaymentParams): Promise<CardPaymentResult> {
  const price = PLAN_PRICES_CENTS[params.plan];
  const headers = buildAuthHeaders();
  let customerId: string;
  try {
    const customerResponse = await axios.post<{ data: { id: string }; error: string | null }>(
      `${ABACATEPAY_API_URL}/v1/customer/create`,
      {
        name: params.buyerName,
        cellphone: params.buyerPhone,
        email: params.email,
        taxId: params.taxId,
      },
      { headers },
    );
    customerId = customerResponse.data.data.id;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AbacatePay customer creation failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
  let billingResponse: { data: { data: { id: string; url: string }; error: string | null } };
  try {
    billingResponse = await axios.post<{ data: { id: string; url: string }; error: string | null }>(
      `${ABACATEPAY_API_URL}/v1/billing/create`,
      {
        frequency: 'ONE_TIME',
        methods: ['CARD'],
        products: [
          {
            externalId: params.mapId,
            name: `Our Love Map — plano ${params.plan}`,
            description: `Mapa interativo para o casal — plano ${params.plan}`,
            quantity: 1,
            price,
          },
        ],
        returnUrl: process.env.OURLOVEMAP_BASE_URL,
        completionUrl: process.env.OURLOVEMAP_BASE_URL,
        customerId,
      },
      { headers },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AbacatePay billing creation failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
  const { id: paymentId, url: checkoutUrl } = billingResponse.data.data;
  await updatePaymentData(params.mapId, { paymentId, checkoutUrl });
  return { checkoutUrl };
}

export interface WebhookProcessResult {
  wasActivated: boolean;
  plan?: Plan;
  mapId?: string;
}

async function resolveMapFromEvent(
  event: AbacatePayWebhookEvent,
  log: FastifyBaseLogger,
): Promise<MapRecord | null> {
  const paymentId = event.data?.id;
  if (paymentId) {
    const map = await getMapByPaymentId(paymentId);
    if (!map) log.warn({ paymentId }, 'Map not found for webhook event');
    return map;
  }
  if (event.event === 'billing.paid') {
    const mapId = event.data?.products?.[0]?.externalId;
    if (!mapId) {
      log.warn({ event: event.event, data: event.data }, 'Webhook billing.paid has no payment id or product externalId');
      return null;
    }
    const map = await getMapById(mapId);
    if (!map) log.warn({ mapId }, 'Map not found for webhook event via product externalId');
    return map;
  }
  log.warn({ event: event.event, data: event.data }, 'Webhook event has no payment id');
  return null;
}

export async function processWebhookEvent(
  event: AbacatePayWebhookEvent,
  log: FastifyBaseLogger,
): Promise<WebhookProcessResult> {
  const isPaidEvent = event.event === 'pix.paid' || event.event === 'billing.paid';
  if (!isPaidEvent) {
    log.info({ event: event.event }, 'Webhook event ignored: not a paid event');
    return { wasActivated: false };
  }
  const map = await resolveMapFromEvent(event, log);
  if (!map) return { wasActivated: false };
  if (map.status === 'active') {
    log.warn({ mapId: map.id }, 'Webhook event ignored: map already active');
    return { wasActivated: false };
  }
  const activatedMap = await activateMap(map.id);
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
