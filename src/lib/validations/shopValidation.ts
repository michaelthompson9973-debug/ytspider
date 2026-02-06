import { z } from 'zod';

export const shopTypeSchema = z.enum(['physical', 'digital'], {
  required_error: 'প্রোডাক্ট টাইপ নির্বাচন করুন',
});

export const shopNameSchema = z.string()
  .min(3, 'নাম কমপক্ষে ৩ অক্ষর হতে হবে')
  .max(50, 'নাম সর্বোচ্চ ৫০ অক্ষর হতে পারে')
  .refine((val) => val.trim().length >= 3, 'নাম কমপক্ষে ৩ অক্ষর হতে হবে');

export const shopSlugSchema = z.string()
  .min(3, 'Slug কমপক্ষে ৩ অক্ষর হতে হবে')
  .max(30, 'Slug সর্বোচ্চ ৩০ অক্ষর হতে পারে')
  .regex(/^[a-z0-9-]+$/, 'শুধু ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন ব্যবহার করুন')
  .refine((val) => !val.startsWith('-') && !val.endsWith('-'), 'হাইফেন দিয়ে শুরু বা শেষ হতে পারবে না');

export const emailSchema = z.string()
  .email('সঠিক ইমেইল ঠিকানা দিন')
  .max(255, 'ইমেইল সর্বোচ্চ ২৫৫ অক্ষর হতে পারে');

// Step 1: Shop Type only
export const createShopStep1Schema = z.object({
  shopType: shopTypeSchema,
});

// Step 2: Shop Name + optional slug
export const createShopStep2Schema = z.object({
  name: shopNameSchema,
  slug: shopSlugSchema.optional(),
});

// Full schema for creating shop
export const createShopSchema = z.object({
  name: shopNameSchema,
  slug: shopSlugSchema,
});

export const createShopForUserSchema = z.object({
  shopName: shopNameSchema,
  slug: shopSlugSchema,
  shopType: shopTypeSchema,
  ownerEmail: emailSchema,
  planId: z.string().min(1, 'প্ল্যান নির্বাচন করুন'),
  durationDays: z.string().refine(
    (val) => ['30', '90', '180', '365'].includes(val),
    'সঠিক মেয়াদ নির্বাচন করুন'
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
