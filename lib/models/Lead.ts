import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const LeadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    key: { type: String, required: true }, // place_id or name|location, for dedup
    name: { type: String },
    score: { type: Number, default: 0 },
    priority: { type: String },
    source: { type: String },
    data: { type: Schema.Types.Mixed }, // full enriched lead
  },
  { timestamps: true },
);
LeadSchema.index({ userId: 1, key: 1 }, { unique: true });

export type LeadDoc = InferSchemaType<typeof LeadSchema> & { _id: mongoose.Types.ObjectId };

export const Lead: Model<LeadDoc> =
  (mongoose.models.Lead as Model<LeadDoc>) ?? mongoose.model<LeadDoc>('Lead', LeadSchema);
