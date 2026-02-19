import mongoose, { Schema, Document } from 'mongoose';

export interface ISettlement extends Document {
  groupId: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId; // The user who paid
  toUser: mongoose.Types.ObjectId; // The user who received payment
  amount: number;
  paymentMethod?: 'cash' | 'upi' | 'Net' | 'other';
  referenceId?: string;
  status: 'pending' | 'awaiting_confirmation' | 'settled';
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SettlementSchema = new Schema<ISettlement>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'Net', 'other'],
    },
    referenceId: { type: String },
    status: {
      type: String,
      enum: ['pending', 'awaiting_confirmation', 'settled'],
      default: 'pending',
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Indexes
SettlementSchema.index({ groupId: 1 });
SettlementSchema.index({ fromUser: 1 });
SettlementSchema.index({ toUser: 1 });

export const SettlementModel = mongoose.model<ISettlement>(
  'Settlement',
  SettlementSchema,
);
