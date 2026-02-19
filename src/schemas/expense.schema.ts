import { z } from 'zod';
import mongoose from 'mongoose';

export const addExpenseSchema = z.object({
  params: z.object({
    groupId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid Group ID',
    }),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    paidBy: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: 'Invalid User ID for Payer',
    }),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    date: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
  }),
});

export const updateExpenseSchema = z.object({
  params: z.object({
    expenseId: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: 'Invalid Expense ID',
      }),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive').optional(),
    description: z
      .string()
      .min(3, 'Description must be at least 3 characters')
      .optional(),
    date: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val))
      .optional(),
  }),
});
