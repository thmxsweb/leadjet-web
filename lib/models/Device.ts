import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const DeviceSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    deviceSecret: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    token: { type: String, default: null, index: true },
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
    label: { type: String },
    pairExpires: { type: Date, required: true },
    tokenExpires: { type: Date, default: null },
    delivered: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type DeviceDoc = InferSchemaType<typeof DeviceSchema> & { _id: mongoose.Types.ObjectId };

export const Device: Model<DeviceDoc> =
  (mongoose.models.Device as Model<DeviceDoc>) ?? mongoose.model<DeviceDoc>('Device', DeviceSchema);
