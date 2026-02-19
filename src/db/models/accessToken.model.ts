import mongoose, { Schema, Document } from 'mongoose';

export interface IAccessToken extends Document {
  token: string;
  userId: mongoose.Types.ObjectId;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccessTokenSchema = new Schema<IAccessToken>(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, default: 'user' },
  },
  { timestamps: true },
);

// TTL index to auto-delete access tokens after 15 minutes (900 seconds)
// Adjust this based on your JWT_ACCESS_EXPIRY setting
AccessTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

export const AccessTokenModel = mongoose.model<IAccessToken>(
  'AccessToken',
  AccessTokenSchema,
);
