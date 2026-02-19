import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  groupId: mongoose.Types.ObjectId;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  description: string;
  date: Date;
  splitAmong: mongoose.Types.ObjectId[];
  perPersonShare: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    amount: { type: Number, required: true, min: 0 },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    splitAmong: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    perPersonShare: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Indexes for better performance
ExpenseSchema.index({ groupId: 1 });
ExpenseSchema.index({ paidBy: 1 });

export const ExpenseModel = mongoose.model<IExpense>('Expense', ExpenseSchema);
