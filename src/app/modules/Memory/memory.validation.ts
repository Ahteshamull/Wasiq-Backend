import { z } from "zod";

const createMemoryZodSchema = z.object({
  body: z.object({
    image: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

const updateMemoryZodSchema = z.object({
  body: z.object({
    image: z.union([z.string(), z.array(z.string())]).optional(),
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const MemoryValidation = {
  createMemoryZodSchema,
  updateMemoryZodSchema,
};

