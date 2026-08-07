/**
 * Zod schemas for public write / auth APIs.
 * Reject unexpected fields via .strict() where the payload is a flat object.
 */
import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(320);

export const contactBodySchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: emailSchema,
    subject: z.string().trim().max(500).optional().nullable(),
    message: z.string().trim().min(1).max(10000),
    _hp: z.string().optional().nullable(),
    _startedAt: z.union([z.number(), z.string()]).optional().nullable(),
  })
  .strict();

export const authSendCodeBodySchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export const authVerifyCodeBodySchema = z
  .object({
    email: emailSchema,
    code: z.string().trim().min(4).max(12),
  })
  .strict();

/** Station update accepts current/new field pairs plus honeypot/timing. */
export const stationUpdateBodySchema = z
  .object({
    stationId: z.string().trim().min(1).max(120),
    stationName: z.string().trim().min(1).max(300),
    submitterName: z.string().trim().min(1).max(200),
    submitterEmail: emailSchema,
    currentAddress: z.string().trim().max(500).optional().nullable(),
    currentPostcode: z.string().trim().max(20).optional().nullable(),
    currentPhone: z.string().trim().max(40).optional().nullable(),
    currentCustodyPhone: z.string().trim().max(40).optional().nullable(),
    currentNonEmergencyPhone: z.string().trim().max(40).optional().nullable(),
    newAddress: z.string().trim().max(500).optional().nullable(),
    newPostcode: z.string().trim().max(20).optional().nullable(),
    newPhone: z.string().trim().max(40).optional().nullable(),
    newCustodyPhone: z.string().trim().max(40).optional().nullable(),
    newNonEmergencyPhone: z.string().trim().max(40).optional().nullable(),
    notes: z.string().trim().max(5000).optional().nullable(),
    _hp: z.string().optional().nullable(),
    _startedAt: z.union([z.number(), z.string()]).optional().nullable(),
  })
  .strict();

export function zodErrorMessage(_err: z.ZodError): string {
  return 'Invalid request. Please check your details and try again.';
}
