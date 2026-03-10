import { MercadoPagoConfig, Payment } from 'mercadopago';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyBaseLogger } from 'fastify';
import {
  getMapByPaymentId,
  activateMap,
  setPaymentFailed,
  updatePaymentData,
  type Plan,
} from './map-service.js';

const PLAN_PRICES: Record<Plan, number> = {
  basic: 19.90,
  premium: 29.90,
};

const PIX_EXPIRATION_MINUTES = 15;

export interface CreatePixPaymentParams {
  mapId: string;
  plan: Plan;
  email: string;
}

export interface PixPaymentResult {
  paymentId: string;
  pixQrCode: string;
  pixCode: string;
  paymentExpiresAt: Date;
}

export interface MercadoPagoEvent {
  data: {
    id: string;
  };
}

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN ?? '',
});

export async function createPixPayment(
  params: CreatePixPaymentParams,
  supabase: SupabaseClient,
): Promise<PixPaymentResult> {
  const amount = PLAN_PRICES[params.plan];
  const paymentExpiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000);
  const payment = new Payment(mpClient);
  const response = await payment.create({
    body: {
      transaction_amount: amount,
      payment_method_id: 'pix',
      payer: { email: params.email },
      date_of_expiration: paymentExpiresAt.toISOString(),
      external_reference: params.mapId,
      description: 'Our Love Map',
    },
  });
  const pixQrCode = response.point_of_interaction?.transaction_data?.qr_code_base64 ?? '';
  const pixCode = response.point_of_interaction?.transaction_data?.qr_code ?? '';
  const paymentId = String(response.id);
  await updatePaymentData(params.mapId, { paymentId, pixQrCode, pixCode, paymentExpiresAt }, supabase);
  return { paymentId, pixQrCode, pixCode, paymentExpiresAt };
}

export async function processWebhookEvent(
  event: MercadoPagoEvent,
  supabase: SupabaseClient,
  log: FastifyBaseLogger,
): Promise<void> {
  const paymentClient = new Payment(mpClient);
  const mpPayment = await paymentClient.get({ id: event.data.id });
  const paymentStatus = mpPayment.status;
  if (paymentStatus !== 'approved' && paymentStatus !== 'rejected' && paymentStatus !== 'cancelled') {
    log.warn({ paymentStatus, paymentId: event.data.id }, 'Webhook event ignored');
    return;
  }
  const map = await getMapByPaymentId(event.data.id, supabase);
  if (!map) return;
  if (paymentStatus === 'approved') {
    await activateMap(map.id, supabase);
  } else {
    await setPaymentFailed(map.id, supabase);
  }
}
