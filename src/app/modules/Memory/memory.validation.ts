import { z } from "zod";

const createMemoryZodSchema = z.object({
  body: z.object({
    image: z.string({
      required_error: "Image is required",
    }),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

const updateMemoryZodSchema = z.object({
  body: z.object({
    image: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const MemoryValidation = {
  createMemoryZodSchema,
  updateMemoryZodSchema,
};
