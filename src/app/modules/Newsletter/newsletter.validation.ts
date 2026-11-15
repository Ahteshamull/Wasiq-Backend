import { z } from "zod";

// create newsletter
const createNewsletterSubscriberSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format")
      .min(1, "Email is required")
      .max(100, "Email must be less than 100 characters"),
  }),
});

// update newsletter
const updateNewsletterSubscriberStatusSchema = z.object({
  params: z.object({
    id: z.string({
      required_error: "Subscriber ID is required",
    }),
  }),
  body: z.object({
    isActive: z.boolean({
      required_error: "isActive status is required",
    }),
  }),
});

// send discount email to all subscribers
const sendDiscountEmailSchema = z.object({
  body: z.object({
    // discountCode: z
    //   .string({
    //     required_error: "Discount code is required",
    //   })
    //   .min(1, "Discount code is required"),
    discountPercentage: z
      .number({
        required_error: "Discount percentage is required",
      })
      .min(1, "Discount percentage must be at least 1")
      .max(100, "Discount percentage cannot exceed 100"),
    discountDescription: z
      .string({
        required_error: "Discount description is required",
      })
      .min(10, "Description must be at least 10 characters"),
    expiryDate: z.string({
      required_error: "Expiry date is required",
    }),
    subject: z.string().optional(),
    websiteUrl: z.string().optional(),
  }),
});

export const NewsletterValidation = {
  createNewsletterSubscriberSchema,
  updateNewsletterSubscriberStatusSchema,
  sendDiscountEmailSchema,
};
