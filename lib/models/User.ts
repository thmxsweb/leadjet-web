import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String },
    fullName: { type: String },
    dob: { type: String },
    phone: { type: String },
    image: { type: String }, // data URL (small, resized client-side)
    passwordHash: { type: String, required: true },
    emailVerified: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ?? mongoose.model<UserDoc>('User', UserSchema);
