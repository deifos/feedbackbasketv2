import { z } from 'zod';

// Project validation schema
export const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .trim(),
  url: z
    .string()
    .url('Please enter a valid URL')
    .max(500, 'URL must be less than 500 characters')
    .refine(url => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'URL must use HTTP or HTTPS protocol'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
});

// Feedback validation schema
export const feedbackSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required').max(50, 'Invalid project ID'),
  content: z
    .string()
    .min(1, 'Feedback content is required')
    .max(2000, 'Feedback must be less than 2000 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be less than 254 characters')
    .optional()
    .or(z.literal('')),
});

// Feedback update schema (for status, notes, and manual overrides)
export const feedbackUpdateSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'DONE']).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').trim().optional(),
  manualCategory: z.enum(['BUG', 'FEATURE', 'REVIEW']).optional(),
  manualSentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']).optional(),
  categoryOverridden: z.boolean().optional(),
  sentimentOverridden: z.boolean().optional(),
});

// Project customization schema
export const projectCustomizationSchema = z.object({
  buttonColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Button color must be a valid hex color')
    .optional(),
  buttonRadius: z
    .number()
    .min(0, 'Button radius must be 0 or greater')
    .max(50, 'Button radius must be 50 or less')
    .optional(),
  buttonLabel: z
    .string()
    .min(1, 'Button label is required')
    .max(50, 'Button label must be less than 50 characters')
    .trim()
    .optional(),
  introMessage: z
    .string()
    .min(1, 'Intro message is required')
    .max(300, 'Intro message must be less than 300 characters')
    .trim()
    .optional(),
  successMessage: z
    .string()
    .min(1, 'Success message is required')
    .max(200, 'Success message must be less than 200 characters')
    .trim()
    .optional(),
});

// Type exports for TypeScript
export type ProjectInput = z.infer<typeof projectSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type FeedbackUpdateInput = z.infer<typeof feedbackUpdateSchema>;
export type ProjectCustomizationInput = z.infer<typeof projectCustomizationSchema>;
