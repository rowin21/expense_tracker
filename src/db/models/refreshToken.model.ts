import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'user' },
  },
  { timestamps: true },
);

// TTL index to auto-delete refresh tokens after 7 days (604800 seconds)
// Adjust this based on your JWT_REFRESH_EXPIRY setting
RefreshTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800 });

export const RefreshTokenModel = mongoose.model<IRefreshToken>(
  'RefreshToken',
  RefreshTokenSchema,
);
