import { z } from "zod";

/**
 * Money and large-integer chain amounts are always strings over the wire
 * (PRD §13, §14.1): never serialize a uint256 or a Decimal as a JS number.
 */
export const DecimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, "must be a decimal string");
export const RawUintStringSchema = z.string().regex(/^\d+$/, "must be an unsigned integer string");

export const IsoDateTimeSchema = z.string().datetime();

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  requestId: z.string(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** PRD §14.1: cursor-based pagination, never offset for chain events. */
export const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
  });
}

export const MoneySchema = z.object({
  amount: DecimalStringSchema,
  currency: z.string().length(3),
});
export type Money = z.infer<typeof MoneySchema>;

export const EvmAddressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "must be a 20-byte hex address");
