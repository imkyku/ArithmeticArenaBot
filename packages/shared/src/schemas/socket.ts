import { z } from 'zod';

export const matchOperationSchema = z.object({
  matchId: z.string().min(1),
  seq: z.number().int().nonnegative(),
  operationType: z.enum(['add', 'sub', 'mul', 'div']),
  operand: z.string().regex(/^\d+$/),
});

export const joinMatchSchema = z.object({
  matchId: z.string().min(1),
});
