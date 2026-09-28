import { z } from "zod";

const createCustomerContactValidation = z.object({
  body: z
    .object({
      name: z.string().min(1, "Name is required").optional(),
      fullName: z.string().min(1, "Full name is required").optional(),
      email: z.string().email("Invalid email format"),
      phone: z.string().min(1, "Phone number is required").optional(),
      contactNumber: z.string().min(1, "Contact number is required").optional(),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "End date is required"),
      address: z.string().min(1, "Address is required"),
      numberOfPassengers: z.coerce
        .number()
        .int("Number of passengers must be an integer")
        .positive("Number of passengers must be at least 1"),
      specialRequest: z.string().optional(),
      subject: z.string().optional(),
      description: z.string().optional(),
    })
    .refine((data) => Boolean(data.name || data.fullName), {
      message: "Name is required",
      path: ["name"],
    })
    .refine((data) => Boolean(data.phone || data.contactNumber), {
      message: "Phone number is required",
      path: ["phone"],
    }),
});

const updateCustomerContactValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    fullName: z.string().min(1, "Full name is required").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().min(1, "Phone number is required").optional(),
    contactNumber: z.string().min(1, "Contact number is required").optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    address: z.string().optional(),
    numberOfPassengers: z.coerce
      .number()
      .int("Number of passengers must be an integer")
      .positive("Number of passengers must be at least 1")
      .optional(),
    specialRequest: z.string().optional(),
    subject: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const CustomerContactValidation = {
  createCustomerContactValidation,
  updateCustomerContactValidation,
};
