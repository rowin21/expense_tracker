import mongoose, { Schema, Document } from 'mongoose';

export interface IOtp extends Document {
  otp: string;
  phone: string;
  countryCode: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    otp: { type: String },
    phone: { type: String, required: true },
    countryCode: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Pre-save hook to generate 6-digit OTP
OtpSchema.pre('save', async function (this: IOtp) {
  if (!this.otp) {
    if (process.env.NODE_ENV === 'development') {
      this.otp = '123456';
    } else {
      this.otp = Math.floor(100000 + Math.random() * 900000).toString();
    }
  }
});

// Compound unique index on countryCode and phone
OtpSchema.index({ countryCode: 1, phone: 1 }, { unique: true });

// TTL index to auto-delete OTP documents after 10 minutes (600 seconds)
OtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export const OtpModel = mongoose.model<IOtp>('OTP', OtpSchema);
