import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  phone: string;
  countryCode: string;
  name?: string;
  email?: string;
  isRegistered: boolean;
  password?: string;
  profileCompleted: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true },
    countryCode: { type: String, required: true },
    name: { type: String },
    email: { type: String },
    profileCompleted: { type: Boolean, default: false },
    isRegistered: { type: Boolean, default: false },
    password: { type: String, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Compound unique index on countryCode and phone
UserSchema.index({ countryCode: 1, phone: 1 }, { unique: true });

export const UserModel = mongoose.model<IUser>('User', UserSchema);
