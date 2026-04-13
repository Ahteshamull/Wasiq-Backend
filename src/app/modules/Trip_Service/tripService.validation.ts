import { z } from "zod";

// create trip service validation schema
const createTripServiceValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    from: z.string().min(1, "From location is required").optional(),
    fromLat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    fromLng: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    to: z.string().min(1, "To location is required").optional(),
    toLat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    toLng: z.string().transform((val) => (val ? parseFloat(val) : undefined)),
    price: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Price must be a positive number"),
    travelTimeMinutes: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine(
        (val) => !val || val > 0,
        "Travel time must be a positive integer",
      ),
    distanceKm: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Distance must be a positive number"),
    groupType: z.string().min(1, "Group type is required"),
    //   images: z.array(z.string().url("Each image must be a valid URL")).optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    serviceType: z
      .enum([
        "BY_THE_HOUR",
        "DAY_TRIP",
        "MULTI_DAY_TOUR",
        "PRIVATE_TRANSFER",
        "AIRPORT_TRANSFER",
      ])
      .default("DAY_TRIP"),
    routeType: z.string().optional().default("city_to_city"),
    tourDays: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val > 0, "Tour days must be a positive integer"),
    isPopular: z
      .string()
      .optional()
      .transform((val) => val === "true")
      .optional()
      .default("false"),
    bookingCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 0))
      .refine((val) => val >= 0, "Booking count must be non-negative")
      .default("0"),
    features: z.any().optional(), // JSON field for features
    isService: z.enum(["AVAILABLE", "BOOKED"]).optional().default("AVAILABLE"),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
    ratings: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : 0))
      .refine((val) => val >= 0 && val <= 5, "Ratings must be between 0 and 5")
      .default("0"),
    reviewCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 0))
      .refine((val) => val >= 0, "Review count must be non-negative")
      .default("0"),
  }),
});

// create day trip service validation schema
const createDayTripServiceValidationSchema = z.object({
  body: z.object({
    from: z.string().min(1, "From location is required"),
    fromLat: z
      .string()
      // .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    fromLng: z
      .string()
      // .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    to: z.string().min(1, "To location is required"),
    toLat: z
      .string()
      // .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    toLng: z.string().transform((val) => (val ? parseFloat(val) : undefined)),
    price: z
      .string()
      // .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Price must be a positive number"),
    travelTimeMinutes: z
      .string()
      // .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine(
        (val) => !val || val > 0,
        "Travel time must be a positive integer",
      ),
    distanceKm: z
      .string()
      // .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Distance must be a positive number"),
    groupType: z.string().min(1, "Group type is required"),
    //   images: z.array(z.string().url("Each image must be a valid URL")).optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    serviceType: z
      .enum([
        "BY_THE_HOUR",
        "DAY_TRIP",
        "MULTI_DAY_TOUR",
        "PRIVATE_TRANSFER",
        "AIRPORT_TRANSFER",
      ])
      .default("DAY_TRIP"),
    routeType: z.string().optional().default("city_to_city"),
    tourDays: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val > 0, "Tour days must be a positive integer"),
    isPopular: z
      .string()
      .optional()
      .transform((val) => val === "true")
      .optional()
      .default("false"),
    bookingCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 0))
      .refine((val) => val >= 0, "Booking count must be non-negative")
      .default("0"),
    features: z.any().optional(), // JSON field for features
    isService: z.enum(["AVAILABLE", "BOOKED"]).optional().default("AVAILABLE"),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
    ratings: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : 0))
      .refine((val) => val >= 0 && val <= 5, "Ratings must be between 0 and 5")
      .default("0"),
    reviewCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 0))
      .refine((val) => val >= 0, "Review count must be non-negative")
      .default("0"),
  }),
});

// create explore service validation schema
const createExploreServiceValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    location: z.string().min(1, "Location is required"),
    price: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Price must be a positive number"),
    time: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val > 0, "Time must be a positive integer"),
    groupType: z.string().optional(),
  }),
});

// create multi day tour trip service validation schema
const createMultiDayTourTripServiceValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required"),
    includedContent: z.array(z.string()).optional(),
    from: z.string().optional(),
    fromLat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    fromLng: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    to: z.string().optional(),
    toLat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    toLng: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    price: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Price must be a positive number"),
    travelTimeMinutes: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine(
        (val) => !val || val > 0,
        "Travel time must be a positive integer",
      ),
    distanceKm: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Distance must be a positive number"),
    groupType: z.string().min(1, "Group type is required"),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters"),
    serviceType: z
      .enum([
        "BY_THE_HOUR",
        "DAY_TRIP",
        "MULTI_DAY_TOUR",
        "PRIVATE_TRANSFER",
        "AIRPORT_TRANSFER",
      ])
      .default("DAY_TRIP"),
    routeType: z.string().optional().default("city_to_city"),
    tourDays: z
      .string()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val > 0, "Tour days must be a positive integer"),
    isPopular: z
      .string()
      .optional()
      .transform((val) => val === "true")
      .optional()
      .default("false"),
    bookingCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 0))
      .refine((val) => val >= 0, "Booking count must be non-negative")
      .default("0"),
    features: z.any().optional(), // JSON field for features
    isService: z.enum(["AVAILABLE", "BOOKED"]).optional().default("AVAILABLE"),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
    ratings: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : 0))
      .refine((val) => val >= 0 && val <= 5, "Ratings must be between 0 and 5")
      .default("0"),
    reviewCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 0))
      .refine((val) => val >= 0, "Review count must be non-negative")
      .default("0"),
  }),
});

// update trip service validation schema
const updateTripServiceValidationSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").optional(),
    from: z.string().min(1, "From location is required").optional(),
    fromLat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    fromLng: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    to: z.string().min(1, "To location is required").optional(),
    toLat: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    toLng: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined)),
    price: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Price must be a positive number"),
    travelTimeMinutes: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine(
        (val) => !val || val > 0,
        "Travel time must be a positive integer",
      ),
    distanceKm: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine((val) => !val || val > 0, "Distance must be a positive number"),
    groupType: z.string().min(1, "Group type is required").optional(),
    //   images: z.array(z.string().url("Each image must be a valid URL")).optional(),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional(),
    serviceType: z
      .enum([
        "BY_THE_HOUR",
        "DAY_TRIP",
        "MULTI_DAY_TOUR",
        "PRIVATE_TRANSFER",
        "AIRPORT_TRANSFER",
      ])
      .optional(),
    routeType: z.string().optional(),
    tourDays: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val > 0, "Tour days must be a positive integer"),
    isPopular: z
      .string()
      .optional()
      .transform((val) => val === "true")
      .optional(),
    bookingCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val >= 0, "Booking count must be non-negative"),
    features: z.any().optional(), // JSON field for features
    isService: z.enum(["AVAILABLE", "BOOKED"]).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
    ratings: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => !val || (val >= 0 && val <= 5),
        "Ratings must be between 0 and 5",
      ),
    reviewCount: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : undefined))
      .refine((val) => !val || val >= 0, "Review count must be non-negative"),
  }),
});

export const TripServiceValidation = {
  createTripServiceValidationSchema,
  createDayTripServiceValidationSchema,
  createMultiDayTourTripServiceValidationSchema,
  updateTripServiceValidationSchema,
  createExploreServiceValidationSchema,
};
