import { z } from "zod";

const createVehicleValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Vehicle name is required"),
    seatCount: z.string().transform((val) => {
      const parsed = parseInt(val);
      if (isNaN(parsed) || parsed < 1) {
        throw new Error("Seat count must be a valid number greater than 0");
      }
      return parsed;
    }),
    luggage: z.string().transform((val) => {
      const parsed = parseInt(val);
      if (isNaN(parsed) || parsed < 0) {
        throw new Error(
          "Luggage capacity must be a valid number greater than or equal to 0",
        );
      }
      return parsed;
    }),
    plateNumber: z.string().min(1, "Plate number is required"),
    isActive: z.string().transform((val) => {
      if (val !== "true" && val !== "false") {
        throw new Error("Active status must be 'true' or 'false'");
      }
      return val === "true";
    }),
  }),
});

const updateVehicleValidation = z.object({
  body: z.object({
    name: z.string().min(1, "Vehicle name is required").optional(),
    seatCount: z
      .string()
      .transform((val) => {
        const parsed = parseInt(val);
        if (isNaN(parsed) || parsed < 1) {
          throw new Error("Seat count must be a valid number greater than 0");
        }
        return parsed;
      })
      .optional(),
    luggage: z
      .string()
      .transform((val) => {
        const parsed = parseInt(val);
        if (isNaN(parsed) || parsed < 0) {
          throw new Error(
            "Luggage capacity must be a valid number greater than or equal to 0",
          );
        }
        return parsed;
      })
      .optional(),
    plateNumber: z.string().optional(),
    isActive: z
      .string()
      .transform((val) => {
        if (val !== "true" && val !== "false") {
          throw new Error("Active status must be 'true' or 'false'");
        }
        return val === "true";
      })
      .optional(),
  }),
});

export const VehicleValidation = {
  createVehicleValidation,
  updateVehicleValidation,
};
