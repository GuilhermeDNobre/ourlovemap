import { Schema, model, type Document, type Types } from 'mongoose';

export interface LocationDocument extends Document {
  _id: Types.ObjectId;
  mapId: Types.ObjectId;
  title: string;
  description?: string;
  message?: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
  order: number;
}

const locationSchema = new Schema<LocationDocument>({
  mapId: { type: Schema.Types.ObjectId, ref: 'Map', required: true },
  title: { type: String, required: true },
  description: { type: String },
  message: { type: String },
  photoUrl: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  order: { type: Number, required: true },
});

locationSchema.index({ mapId: 1, order: 1 });

export const LocationModel = model<LocationDocument>('Location', locationSchema);
