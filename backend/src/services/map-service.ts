import type { SupabaseClient } from '@supabase/supabase-js';
import { generateSlug } from '../utils/slug.js';
import { generateToken } from '../utils/token.js';

export type MapStatus = 'pending_payment' | 'active' | 'expired' | 'payment_failed';
export type Plan = 'basic' | 'premium';

export interface LocationInput {
  title: string;
  description?: string;
  message?: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface CreateMapData {
  id?: string;
  coupleName: string;
  buyerName: string;
  buyerPhone: string;
  email: string;
  plan: Plan;
  relationshipStartDate: string;
  locations: LocationInput[];
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
}

export interface MapRecord {
  id: string;
  coupleName: string;
  buyerName: string;
  buyerPhone: string;
  slug: string;
  email: string;
  plan: Plan;
  relationshipStartDate: string;
  token: string | null;
  status: MapStatus;
  youtubeVideoId: string | null;
  youtubeStartTime: number | null;
  youtubeEndTime: number | null;
  paymentId: string | null;
  checkoutUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface Location {
  id: string;
  mapId: string;
  title: string;
  description: string | null;
  message: string | null;
  photoUrl: string | null;
  latitude: number;
  longitude: number;
  order: number;
}

export interface MapPaymentStatus {
  status: MapStatus;
  checkoutUrl: string | null;
}

export interface PaymentData {
  checkoutUrl: string;
}

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const PLAN_LOCATION_LIMITS: Record<Plan, number> = {
  basic: 3,
  premium: 7,
};

const BASIC_PLAN_EXPIRY_DAYS = 7;

export async function createMap(data: CreateMapData, supabase: SupabaseClient): Promise<MapRecord> {
  const limit = PLAN_LOCATION_LIMITS[data.plan];
  if (data.locations.length > limit) {
    const error = new Error(`Plan ${data.plan} allows at most ${limit} locations`) as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  const insertPayload: Record<string, unknown> = {
    couple_name: data.coupleName,
    buyer_name: data.buyerName,
    buyer_phone: data.buyerPhone,
    slug: '',
    email: data.email,
    plan: data.plan,
    relationship_start_date: data.relationshipStartDate,
    status: 'pending_payment',
    youtube_video_id: data.youtubeVideoId ?? null,
    youtube_start_time: data.youtubeStartTime ?? null,
    youtube_end_time: data.youtubeEndTime ?? null,
  };
  if (data.id) insertPayload.id = data.id;
  const { data: mapRow, error: mapError } = await supabase
    .from('maps')
    .insert(insertPayload)
    .select()
    .single();
  if (mapError) throw new Error(mapError.message);
  const locationRows = data.locations.map(loc => ({
    map_id: mapRow.id,
    title: loc.title,
    description: loc.description ?? null,
    message: loc.message ?? null,
    photo_url: loc.photoUrl ?? null,
    latitude: loc.latitude,
    longitude: loc.longitude,
    order: loc.order,
  }));
  const { error: locError } = await supabase.from('locations').insert(locationRows);
  if (locError) throw new Error(locError.message);
  return toMapRecord(mapRow);
}

export async function activateMap(mapId: string, supabase: SupabaseClient): Promise<MapRecord> {
  const { data: existingMap, error: fetchError } = await supabase
    .from('maps')
    .select()
    .eq('id', mapId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  const slug = generateSlug(existingMap.couple_name);
  const token = generateToken();
  const expiresAt = existingMap.plan === 'basic'
    ? new Date(Date.now() + BASIC_PLAN_EXPIRY_DAYS * ONE_DAY_IN_MS).toISOString()
    : null;
  const { data: updatedMap, error: updateError } = await supabase
    .from('maps')
    .update({ slug, token, expires_at: expiresAt, status: 'active' })
    .eq('id', mapId)
    .select()
    .single();
  if (updateError) throw new Error(updateError.message);
  return toMapRecord(updatedMap);
}

export async function setPaymentFailed(mapId: string, supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from('maps')
    .update({ status: 'payment_failed' })
    .eq('id', mapId);
  if (error) throw new Error(error.message);
}

export async function getMapByToken(token: string, supabase: SupabaseClient): Promise<MapRecord | null> {
  const { data, error } = await supabase
    .from('maps')
    .select()
    .eq('token', token)
    .single();
  if (error || !data) return null;
  const now = new Date();
  const isExpired = data.expires_at !== null && new Date(data.expires_at) < now && data.status === 'active';
  if (isExpired) {
    await expireMap(data.id, supabase);
    return toMapRecord({ ...data, status: 'expired' });
  }
  return toMapRecord(data);
}

export async function getMapById(id: string, supabase: SupabaseClient): Promise<MapRecord | null> {
  const { data, error } = await supabase
    .from('maps')
    .select()
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return toMapRecord(data);
}

export async function getMapByOrderNsu(orderNsu: string, supabase: SupabaseClient): Promise<MapRecord | null> {
  return getMapById(orderNsu, supabase);
}

export async function getPaymentStatus(mapId: string, supabase: SupabaseClient): Promise<MapPaymentStatus> {
  const { data, error } = await supabase
    .from('maps')
    .select('status, checkout_url')
    .eq('id', mapId)
    .single();
  if (error) throw new Error(error.message);
  return {
    status: data.status as MapStatus,
    checkoutUrl: data.checkout_url as string | null,
  };
}

export async function updatePaymentData(mapId: string, data: PaymentData, supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from('maps')
    .update({ checkout_url: data.checkoutUrl })
    .eq('id', mapId);
  if (error) throw new Error(error.message);
}

export async function getLocationsByMapId(mapId: string, supabase: SupabaseClient): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select()
    .eq('map_id', mapId)
    .order('order', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toLocation);
}

async function expireMap(mapId: string, supabase: SupabaseClient): Promise<void> {
  const { error } = await supabase
    .from('maps')
    .update({ status: 'expired' })
    .eq('id', mapId);
  if (error) throw new Error(error.message);
}

function toLocation(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    mapId: row.map_id as string,
    title: row.title as string,
    description: row.description as string | null,
    message: row.message as string | null,
    photoUrl: row.photo_url as string | null,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    order: row.order as number,
  };
}

function toMapRecord(row: Record<string, unknown>): MapRecord {
  return {
    id: row.id as string,
    coupleName: row.couple_name as string,
    buyerName: row.buyer_name as string,
    buyerPhone: row.buyer_phone as string,
    slug: row.slug as string,
    email: row.email as string,
    plan: row.plan as Plan,
    relationshipStartDate: row.relationship_start_date as string,
    token: row.token as string | null,
    status: row.status as MapStatus,
    youtubeVideoId: row.youtube_video_id as string | null,
    youtubeStartTime: row.youtube_start_time as number | null,
    youtubeEndTime: row.youtube_end_time as number | null,
    paymentId: row.payment_id as string | null,
    checkoutUrl: row.checkout_url as string | null,
    expiresAt: row.expires_at as string | null,
    createdAt: row.created_at as string,
  };
}
