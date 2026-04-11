import { Types } from 'mongoose';
import { MapModel, type MapDocument, type MapStatus, type Plan } from '../models/map-model.js';
import { LocationModel, type LocationDocument } from '../models/location-model.js';
import { generateSlug } from '../utils/slug.js';
import { generateToken } from '../utils/token.js';

export type { MapStatus, Plan };

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
export const PLAN_LOCATION_LIMITS: Record<Plan, number> = { basic: 3, premium: 7, test: 7 };
const BASIC_PLAN_EXPIRY_DAYS = 7;

function toMapRecord(doc: MapDocument): MapRecord {
  return {
    id: doc._id.toString(),
    coupleName: doc.coupleName,
    buyerName: doc.buyerName,
    buyerPhone: doc.buyerPhone,
    slug: doc.slug,
    email: doc.email,
    plan: doc.plan,
    relationshipStartDate: doc.relationshipStartDate instanceof Date
      ? doc.relationshipStartDate.toISOString().split('T')[0]
      : String(doc.relationshipStartDate),
    token: doc.token ?? null,
    status: doc.status,
    youtubeVideoId: doc.youtubeVideoId ?? null,
    youtubeStartTime: doc.youtubeStartTime ?? null,
    youtubeEndTime: doc.youtubeEndTime ?? null,
    paymentId: doc.paymentId ?? null,
    checkoutUrl: doc.checkoutUrl ?? null,
    expiresAt: doc.expiresAt ? doc.expiresAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
  };
}

function toLocation(doc: LocationDocument): Location {
  return {
    id: doc._id.toString(),
    mapId: doc.mapId.toString(),
    title: doc.title,
    description: doc.description ?? null,
    message: doc.message ?? null,
    photoUrl: doc.photoUrl ?? null,
    latitude: doc.latitude,
    longitude: doc.longitude,
    order: doc.order,
  };
}

export async function createMap(data: CreateMapData): Promise<MapRecord> {
  const limit = PLAN_LOCATION_LIMITS[data.plan];
  if (data.locations.length > limit) {
    const error = new Error(`Plan ${data.plan} allows at most ${limit} locations`) as Error & { statusCode: number };
    error.statusCode = 422;
    throw error;
  }
  const mapId = data.id ? new Types.ObjectId(data.id) : new Types.ObjectId();
  const doc = await MapModel.create({
    _id: mapId,
    coupleName: data.coupleName,
    buyerName: data.buyerName,
    buyerPhone: data.buyerPhone,
    slug: '',
    email: data.email,
    plan: data.plan,
    relationshipStartDate: new Date(data.relationshipStartDate),
    status: 'pending_payment',
    youtubeVideoId: data.youtubeVideoId,
    youtubeStartTime: data.youtubeStartTime,
    youtubeEndTime: data.youtubeEndTime,
  });
  const locationDocs = data.locations.map(loc => ({
    mapId: doc._id,
    title: loc.title,
    description: loc.description,
    message: loc.message,
    photoUrl: loc.photoUrl,
    latitude: loc.latitude,
    longitude: loc.longitude,
    order: loc.order,
  }));
  await LocationModel.insertMany(locationDocs);
  return toMapRecord(doc);
}

export async function activateMap(mapId: string): Promise<MapRecord> {
  const existing = await MapModel.findById(mapId);
  if (!existing) throw new Error(`Map not found: ${mapId}`);
  const slug = generateSlug(existing.coupleName);
  const token = generateToken();
  const expiresAt = existing.plan === 'basic'
    ? new Date(Date.now() + BASIC_PLAN_EXPIRY_DAYS * ONE_DAY_IN_MS)
    : undefined;
  const updated = await MapModel.findByIdAndUpdate(
    mapId,
    { slug, token, expiresAt, status: 'active' },
    { new: true },
  );
  if (!updated) throw new Error(`Map not found after update: ${mapId}`);
  return toMapRecord(updated);
}

export async function setPaymentFailed(mapId: string): Promise<void> {
  await MapModel.findByIdAndUpdate(mapId, { status: 'payment_failed' });
}

async function expireMap(mapId: Types.ObjectId): Promise<MapDocument | null> {
  return MapModel.findByIdAndUpdate(mapId, { status: 'expired' }, { new: true });
}

export async function getMapByToken(token: string): Promise<MapRecord | null> {
  const doc = await MapModel.findOne({ token });
  if (!doc) return null;
  const now = new Date();
  const isExpired = doc.expiresAt !== undefined && doc.expiresAt < now && doc.status === 'active';
  if (isExpired) {
    const expiredDoc = await expireMap(doc._id);
    return expiredDoc ? toMapRecord(expiredDoc) : toMapRecord(doc);
  }
  return toMapRecord(doc);
}

export async function getMapById(id: string): Promise<MapRecord | null> {
  const doc = await MapModel.findById(id);
  if (!doc) return null;
  return toMapRecord(doc);
}

export async function getMapByOrderNsu(orderNsu: string): Promise<MapRecord | null> {
  return getMapById(orderNsu);
}

export async function getPaymentStatus(mapId: string): Promise<MapPaymentStatus> {
  const doc = await MapModel.findById(mapId, 'status checkoutUrl');
  if (!doc) throw new Error(`Map not found: ${mapId}`);
  return {
    status: doc.status,
    checkoutUrl: doc.checkoutUrl ?? null,
  };
}

export async function updatePaymentData(mapId: string, data: PaymentData): Promise<void> {
  await MapModel.findByIdAndUpdate(mapId, { checkoutUrl: data.checkoutUrl });
}

export async function getLocationsByMapId(mapId: string): Promise<Location[]> {
  const docs = await LocationModel.find({ mapId }).sort({ order: 1 });
  return docs.map(toLocation);
}
