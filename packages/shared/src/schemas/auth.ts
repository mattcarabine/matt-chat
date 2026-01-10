import { z } from 'zod';

// Username: BetterAuth defaults (3-30 chars, alphanumeric + underscores)
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only');

// Password: min 8 chars, no complexity requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters');

// Full name: required, max 100 chars
export const fullNameSchema = z
  .string()
  .min(1, 'Full name is required')
  .max(100, 'Full name must be at most 100 characters');

// Email: valid format
export const emailSchema = z.string().email('Invalid email address');

// Sign up schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
  fullName: fullNameSchema,
});

// Sign in schema (supports both username and email via single 'login' field)
export const signInSchema = z.object({
  login: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Type exports
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
