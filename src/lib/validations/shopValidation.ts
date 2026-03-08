import { z } from 'zod';

export const shopTypeSchema = z.enum(['physical', 'digital'], {
  required_error: 'Please select a product type',
});

export const shopNameSchema = z.string()
  .min(3, 'Name must be at least 3 characters')
  .max(50, 'Name can be at most 50 characters')
  .refine((val) => val.trim().length >= 3, 'Name must be at least 3 characters');

export const shopSlugSchema = z.string()
  .min(3, 'Slug must be at least 3 characters')
  .max(30, 'Slug can be at most 30 characters')
  .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed')
  .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'Cannot start or end with a hyphen');

export const emailSchema = z.string()
  .email('Please enter a valid email address')
  .max(255, 'Email can be at most 255 characters');

export const createShopStep1Schema = z.object({
  shopType: shopTypeSchema,
});

export const createShopStep2Schema = z.object({
  name: shopNameSchema,
  slug: shopSlugSchema.optional(),
});

export const createShopSchema = z.object({
  name: shopNameSchema,
  slug: shopSlugSchema,
});

export const createShopForUserSchema = z.object({
  shopName: shopNameSchema,
  slug: shopSlugSchema,
  shopType: shopTypeSchema,
  ownerEmail: emailSchema,
  planId: z.string().min(1, 'Please select a plan'),
  durationDays: z.string().refine(
    (val) => ['30', '90', '180', '365'].includes(val),
    'Please select a valid duration'
  ),
  sendCredentials: z.boolean(),
});

export const shopOnboardingStep1Schema = z.object({
  shopName: shopNameSchema,
});

export type ShopType = z.infer<typeof shopTypeSchema>;
export type CreateShopStep1Input = z.infer<typeof createShopStep1Schema>;
export type CreateShopStep2Input = z.infer<typeof createShopStep2Schema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type CreateShopForUserInput = z.infer<typeof createShopForUserSchema>;
export type ShopOnboardingStep1Input = z.infer<typeof shopOnboardingStep1Schema>;