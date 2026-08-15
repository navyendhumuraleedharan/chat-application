import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().trim().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID is required'),
  content: z.string().trim().min(1, 'Message content cannot be empty'),
});
