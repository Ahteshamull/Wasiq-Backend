import { z } from "zod";

const createBlogValidation = z.object({
  body: z.object({
    title: z.string().min(1, "Blog title is required"),
    content: z.string().min(1, "Blog content is required"),
    category: z.string().min(1, "Blog category is required"),
  }),
});

const updateBlogValidation = z.object({
  body: z.object({
    title: z.string().min(1, "Blog title is required").optional(),
    content: z.string().min(1, "Blog content is required").optional(),
    category: z.string().min(1, "Blog category is required").optional(),
  }),
});

export const BlogValidation = {
  createBlogValidation,
  updateBlogValidation,
};
