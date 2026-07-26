import { z } from "zod";

const createFaqValidation = z.object({
  body: z.object({
    question: z
      .string({
        required_error: "Question is required",
      })
      .min(1, "Question cannot be empty"),
    answer: z
      .string({
        required_error: "Answer is required",
      })
      .min(1, "Answer cannot be empty"),
    serviceType: z.enum(["BY_THE_HOUR", "DAY_TRIP", "TRANSFER"], {
      required_error: "Service type is required",
    }),
  }),
});

const updateFaqValidation = z.object({
  body: z.object({
    question: z.string().min(1, "Question cannot be empty").optional(),
    answer: z.string().min(1, "Answer cannot be empty").optional(),
    serviceType: z.enum(["BY_THE_HOUR", "DAY_TRIP", "TRANSFER"]).optional(),
  }),
});

export const FaqValidation = {
  createFaqValidation,
  updateFaqValidation,
};
