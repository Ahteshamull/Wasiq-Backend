import express from "express";
import { TripServiceBookingController } from "./tripServiceBooking.controller";
import auth, { optionalAuth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { TripServiceBookingValidation } from "./tripServiceBooking.validation";
import validateRequest from "../../middlewares/validateRequest";
import { sendBookingEmail } from "../../middlewares/sendBookingEmail";

const router = express.Router();

// create booking without tripServiceId in URL (tripServiceId comes from body)
router.post(
  "/create-booking",
  optionalAuth(),
  validateRequest(
    TripServiceBookingValidation.createTripServiceBookingValidation,
  ),
  TripServiceBookingController.createBookingWithoutParam,
  sendBookingEmail
);

// create trip service booking (tripServiceId from URL param)
router.post(
  "/:tripServiceId",
  optionalAuth(),
  validateRequest(
    TripServiceBookingValidation.createTripServiceBookingValidation,
  ),
  TripServiceBookingController.createTripServiceBooking,
  sendBookingEmail
);

router.patch(
  "/update-booking/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT),
  validateRequest(
    TripServiceBookingValidation.updateTripServiceBookingValidation,
  ),
  TripServiceBookingController.updateTripServiceBooking,
);

// get my trip service booking
router.get(
  "/my-bookings",
  auth(UserRole.USER, UserRole.AGENT),
  TripServiceBookingController.getMyTripServiceBookings,
);

// get all trip service booking by admin
router.get(
  "/all-bookings",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TripServiceBookingController.getAllTripServiceBookings,
);

// get single booking who BookingStatus confirmed
router.get(
  "/single/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.AGENT, UserRole.USER),
  TripServiceBookingController.getSingleBooking,
);
//local
router.delete(
  "/delete-booking/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT),
  TripServiceBookingController.deleteTripServiceBooking,
);

export const tripServiceBookingRoute = router;
