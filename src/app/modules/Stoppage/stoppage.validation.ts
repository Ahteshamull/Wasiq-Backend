import { z } from "zod";

const createStoppageValidation = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters"),
    type: z
      .string()
      .min(1, "Type is required")
      .max(50, "Type cannot exceed 50 characters"),
    price: z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) {
        throw new Error("Price must be a positive number");
      }
      return num;
    }),
    duration: z
      .string()
      .transform((val) => {
        if (!val) return undefined;
        const num = parseInt(val);
        if (isNaN(num) || num < 0) {
          throw new Error("Duration must be a positive number");
        }
        return num;
      })
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    latitude: z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) {
        throw new Error("Latitude must be a valid number");
      }
      return num;
    }),
    longitude: z.string().transform((val) => {
      const num = parseFloat(val);
      if (isNaN(num)) {
        throw new Error("Longitude must be a valid number");
      }
      return num;
    }),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

const updateStoppageValidation = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    type: z
      .string()
      .min(1, "Type is required")
      .max(50, "Type cannot exceed 50 characters")
      .optional(),
    price: z
      .string()
      .transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) {
          throw new Error("Price must be a positive number");
        }
        return num;
      })
      .optional(),
    duration: z
      .string()
      .transform((val) => {
        if (!val) return undefined;
        const num = parseInt(val);
        if (isNaN(num) || num < 0) {
          throw new Error("Duration must be a positive number");
        }
        return num;
      })
      .optional(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
    latitude: z
      .string()
      .transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("Latitude must be a valid number");
        }
        return num;
      })
      .optional(),
    longitude: z
      .string()
      .transform((val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {
          throw new Error("Longitude must be a valid number");
        }
        return num;
      })
      .optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
});

const SearchableStoppageSchema = z.object({
  body: z.object({
    to: z.object({
      location: z.string(),
      coordinates: z.array(z.number()).length(2).optional(),
    }),
    from: z.object({
      location: z.string(),
      coordinates: z.array(z.number()).length(2).optional(),
    }),
  }),
});

export const StoppageValidation = {
  createStoppageValidation,
  updateStoppageValidation,
  SearchableStoppageSchema,
};
