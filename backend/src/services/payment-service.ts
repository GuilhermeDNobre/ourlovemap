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

const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2';
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

const productIdCache = new Map<string, string>();

async function getOrCreateProductId(plan: Plan): Promise<string> {
  if (productIdCache.has(plan)) {
    return productIdCache.get(plan)!;
  }
  const headers = buildAuthHeaders();
  const price = PLAN_PRICES_CENTS[plan];
  try {
    const listResponse = await axios.get<{ data: Array<{ id: string; externalId: string }> }>(
      `${ABACATEPAY_API_URL}/products/list`,
      { params: { externalId: plan }, headers },
    );
    const existing = listResponse.data.data?.[0];
    if (existing?.id) {
      productIdCache.set(plan, existing.id);
      return existing.id;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AbacatePay product lookup failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
  try {
    const createResponse = await axios.post<{ data: { id: string } }>(
      `${ABACATEPAY_API_URL}/products/create`,
      {
        externalId: plan,
        name: `Our Love Map — plano ${plan}`,
        description: `Mapa interativo para o casal — plano ${plan}`,
        price,
        currency: 'BRL',
      },
      { headers },
    );
    const productId = createResponse.data.data.id;
    productIdCache.set(plan, productId);
    return productId;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AbacatePay product creation failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
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

interface AbacatePayPaymentData {
  id?: string;
  externalId?: string;
}

export interface AbacatePayWebhookEvent {
  id?: string;
  event: string;
  apiVersion?: number;
  devMode?: boolean;
  data: {
    checkout?: AbacatePayPaymentData;
    transparent?: AbacatePayPaymentData;
  };
}

export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  const price = PLAN_PRICES_CENTS[params.plan];
  let response: { data: { data: { id: string; brCode: string; brCodeBase64: string; expiresAt: string }; error: string | null } };
  try {
    response = await axios.post<{ data: { id: string; brCode: string; brCodeBase64: string; expiresAt: string }; error: string | null }>(
      `${ABACATEPAY_API_URL}/transparents/create`,
      {
        method: 'PIX',
        data: {
          amount: price,
          expiresIn: PIX_EXPIRY_SECONDS,
          description: `Our Love Map — plano ${params.plan}`,
          externalId: params.mapId,
        },
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
  const headers = buildAuthHeaders();
  let customerId: string;
  try {
    const customerResponse = await axios.post<{ data: { id: string }; error: string | null }>(
      `${ABACATEPAY_API_URL}/customers/create`,
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
  const productId = await getOrCreateProductId(params.plan);
  let checkoutResponse: { data: { data: { id: string; url: string }; error: string | null } };
  try {
    checkoutResponse = await axios.post<{ data: { id: string; url: string }; error: string | null }>(
      `${ABACATEPAY_API_URL}/checkouts/create`,
      {
        items: [{ id: productId, quantity: 1 }],
        methods: ['CARD'],
        customerId,
        externalId: params.mapId,
        returnUrl: process.env.OURLOVEMAP_BASE_URL,
        completionUrl: `${process.env.OURLOVEMAP_BASE_URL}/pagamento-confirmado`,
      },
      { headers },
    );
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`AbacatePay checkout creation failed: ${error.response?.status ?? 'network error'} — ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
  const { id: paymentId, url: checkoutUrl } = checkoutResponse.data.data;
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
  const paymentData = event.data?.checkout ?? event.data?.transparent;
  const paymentId = paymentData?.id;
  if (paymentId) {
    const map = await getMapByPaymentId(paymentId);
    if (map) return map;
    log.warn({ paymentId }, 'Map not found by paymentId, trying externalId');
  }
  const mapId = paymentData?.externalId;
  if (!mapId) {
    log.warn({ event: event.event, data: event.data }, 'Webhook event has no paymentId or externalId');
    return null;
  }
  const map = await getMapById(mapId);
  if (!map) log.warn({ mapId }, 'Map not found for webhook event via externalId');
  return map;
}

export async function processWebhookEvent(
  event: AbacatePayWebhookEvent,
  log: FastifyBaseLogger,
): Promise<WebhookProcessResult> {
  const isPaidEvent = event.event === 'transparent.completed' || event.event === 'checkout.completed';
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
