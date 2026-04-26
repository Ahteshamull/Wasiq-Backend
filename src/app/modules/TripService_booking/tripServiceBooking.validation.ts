import { z } from "zod";

const createTripServiceBookingValidation = z.object({
  body: z.object({
    clientName: z.string().optional(),
    from: z.string().min(1, "From location is required"),
    fromLat: z.number().optional(),
    fromLng: z.number().optional(),
    to: z.string().min(1, "To location is required"),
    toLat: z.number().optional(),
    toLng: z.number().optional(),
    serviceType: z.enum([
      "BY_THE_HOUR",
      "DAY_TRIP",
      "MULTI_DAY_TOUR",
      "PRIVATE_TRANSFER",
      "AIRPORT_TRANSFER",
      "TRANSFER",
    ]),
    travelDate: z.string().transform((val) => new Date(val)),
    timeSlot: z.any().optional(),
    passengers: z.number().int().min(1, "Passengers must be at least 1"),
    luggage: z.number().int().min(0).optional(),
    distanceKm: z.number().optional(),
    basePrice: z.number().min(0, "Base price is required"),
    vehiclePrice: z.number().min(0, "Vehicle price is required"),
    stoppagePrice: z.number().optional(),
    totalPrice: z.number().min(0, "Total price is required"),
    returnPrice: z.number().optional(),
    isReturn: z.boolean().default(false),
    returnDate: z
      .string()
      .transform((val) => new Date(val))
      .optional(),
    user_role: z.string().optional(),
    bookingVehicles: z
      .array(
        z.object({
          vehicleId: z.string().min(1, "Vehicle ID is required"),
          quantity: z.number().int().min(1, "Quantity must be at least 1"),
        }),
      )
      .optional(),
    bookingStoppages: z
      .array(
        z.object({
          stoppageId: z.string().min(1, "Stoppage ID is required"),
          quantity: z.number().int().min(1, "Quantity must be at least 1"),
        }),
      )
      .optional(),
  }),
});

const updateTripServiceBookingValidation = z.object({
  body: z.object({
    clientName: z.string().optional(),
    from: z.string().optional(),
    fromLat: z.number().optional(),
    fromLng: z.number().optional(),
    to: z.string().optional(),
    toLat: z.number().optional(),
    toLng: z.number().optional(),
    serviceType: z.enum([
      "BY_THE_HOUR",
      "DAY_TRIP",
      "MULTI_DAY_TOUR",
      "PRIVATE_TRANSFER",
      "AIRPORT_TRANSFER",
      "TRANSFER",
    ]).optional(),
    travelDate: z.string().transform((val) => new Date(val)).optional(),
    timeSlot: z.any().optional(),
    passengers: z.number().int().min(1).optional(),
    luggage: z.number().int().min(0).optional(),
    distanceKm: z.number().optional(),
    basePrice: z.number().min(0).optional(),
    vehiclePrice: z.number().min(0).optional(),
    stoppagePrice: z.number().optional(),
    totalPrice: z.number().min(0).optional(),
    returnPrice: z.number().optional(),
    isReturn: z.boolean().optional(),
    returnDate: z.string().transform((val) => new Date(val)).optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
    user_role: z.string().optional(),
  }),
});

export const TripServiceBookingValidation = {
  createTripServiceBookingValidation,
  updateTripServiceBookingValidation,
};
