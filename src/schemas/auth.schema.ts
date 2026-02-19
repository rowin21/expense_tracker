import { z } from 'zod';

export const sendOtpSchema = z.object({
  body: z.object({
    countryCode: z
      .string()
      .min(1, 'Country code is required')
      .max(4, 'Country code must be at most 4 characters')
      .regex(/^\d+$/, 'Country code must contain only digits'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be at most 15 digits')
      .regex(/^\d+$/, 'Phone number must contain only digits'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    countryCode: z
      .string()
      .min(1, 'Country code is required')
      .max(4, 'Country code must be at most 4 characters')
      .regex(/^\d+$/, 'Country code must contain only digits'),
    phone: z
      .string()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number must be at most 15 digits')
      .regex(/^\d+$/, 'Phone number must contain only digits'),
    otp: z
      .string()
      .length(6, 'OTP must be exactly 6 digits')
      .regex(/^\d+$/, 'OTP must contain only digits'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
