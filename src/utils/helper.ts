import crypto from 'crypto';

export const generateTransactionId = (): string => {
  return crypto.randomUUID();
};
