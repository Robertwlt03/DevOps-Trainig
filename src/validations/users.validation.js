import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.string().regex(/^\d+$/, { message: 'id must be a numeric string' }),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z.string().email().max(255).lowercase().trim().optional(),
    password: z.string().min(6).max(255).optional(),
    role: z.enum(['user', 'admin']).optional(),
    updated_from: z.string().max(255).optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
