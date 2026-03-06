import { z } from 'zod';

export const BigIntStringSchema = z.string().regex(/^\d+$/);

export const parseBigIntString = (value: string): bigint => BigInt(BigIntStringSchema.parse(value));

export const digitLength = (value: bigint): number => value.toString().length;

export const isExactDivision = (value: bigint, divisor: bigint): boolean => {
  if (divisor === 0n) return false;
  return value % divisor === 0n;
};

export const absDistanceBigInt = (a: bigint, b: bigint): bigint => (a >= b ? a - b : b - a);
