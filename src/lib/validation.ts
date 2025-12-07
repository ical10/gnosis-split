import { z } from 'zod';

export const ParticipantSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  name: z.string().optional(),
  amount: z.number().positive('Amount must be positive')
});

export const PaymentSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  txHash: z.string().optional()
});

export const SplitCreateSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  payerAddress: z.string().min(1, 'Payer address is required'),
  participants: z.array(ParticipantSchema).min(1, 'At least one participant is required'),
  payments: z.array(PaymentSchema).default([]),
  sourceTxId: z.string().optional()
});

export const SplitUpdateSchema = SplitCreateSchema.partial();

export const ParticipantsUpdateSchema = z.object({
  participants: z.array(ParticipantSchema).min(1, 'At least one participant is required')
});

export type SplitCreate = z.infer<typeof SplitCreateSchema>;
export type SplitUpdate = z.infer<typeof SplitUpdateSchema>;
export type ParticipantsUpdate = z.infer<typeof ParticipantsUpdateSchema>;
