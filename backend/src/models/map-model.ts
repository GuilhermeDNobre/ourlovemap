import { Schema, model, type Document, type Types } from 'mongoose';

export type MapStatus = 'pending_payment' | 'active' | 'expired' | 'payment_failed';
export type Plan = 'basic' | 'premium';

export interface MapDocument extends Document {
  _id: Types.ObjectId;
  coupleName: string;
  buyerName: string;
  buyerPhone: string;
  slug: string;
  email: string;
  plan: Plan;
  relationshipStartDate: Date;
  token?: string;
  status: MapStatus;
  youtubeVideoId?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
  paymentId?: string;
  checkoutUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mapSchema = new Schema<MapDocument>(
  {
    coupleName: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    slug: { type: String, default: '' },
    email: { type: String, required: true },
    plan: { type: String, enum: ['basic', 'premium'], required: true },
    relationshipStartDate: { type: Date, required: true },
    token: { type: String, unique: true, sparse: true },
    status: {
      type: String,
      enum: ['pending_payment', 'active', 'expired', 'payment_failed'],
      default: 'pending_payment',
    },
    youtubeVideoId: { type: String },
    youtubeStartTime: { type: Number },
    youtubeEndTime: { type: Number },
    paymentId: { type: String },
    checkoutUrl: { type: String },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

export const MapModel = model<MapDocument>('Map', mapSchema);
