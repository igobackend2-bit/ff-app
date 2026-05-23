// Skill #17 — Centralized Zod schemas for API validation

import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authRequestSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^\+?91[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z.string().email('Invalid email address'),
});

export const otpVerifySchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().email(),
  otp: z
    .string()
    .length(6)
    .regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

// ── Cart ──────────────────────────────────────────────────────────────────────

export const cartSyncSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive().max(99),
    }),
  ),
});

export const cartUpdateSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.number().int().min(0).max(99),
});

// ── Orders ────────────────────────────────────────────────────────────────────

export const createOrderSchema = z.object({
  addressId: z.string().cuid(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive().max(99),
    }),
  ).min(1, 'Order must have at least one item'),
  couponCode: z.string().max(20).optional(),
});

// ── Products ──────────────────────────────────────────────────────────────────

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().max(100).optional(),
  sort: z
    .enum(['relevance', 'price_asc', 'price_desc', 'discount', 'new'])
    .default('relevance'),
  brand: z.string().optional(),
  tags: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

// ── Address ───────────────────────────────────────────────────────────────────

export const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']),
  line1: z.string().min(5).max(200),
  line2: z.string().max(100).optional(),
  landmark: z.string().max(100).optional(),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  isDefault: z.boolean().default(false),
});
