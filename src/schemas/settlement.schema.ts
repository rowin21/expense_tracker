import { z } from 'zod';
import mongoose from 'mongoose';

export const initiateSettlementSchema = z.object({
  params: z.object({
    settlementId: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid Settlement ID',
      }),
  }),
  body: z.object({
    paymentMethod: z.enum(['cash', 'upi', 'Net', 'other']),
    referenceId: z.string().optional(),
  }),
});

export const updateSettlementStatusSchema = z.object({
  params: z.object({
    settlementId: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid Settlement ID',
      }),
  }),
  body: z.object({
    status: z.enum(['settled', 'rejected']), // Can reject to send back to pending? Or just settled? The user said "after A accepts status will be settled". Maybe reject too.
  }),
});
