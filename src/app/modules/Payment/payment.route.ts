import express from "express";
import { PaymentController } from "./payment.controller";
import auth, { optionalAuth } from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// ------------------------------stripe routes-----------------------------
// stripe account onboarding
router.post(
  "/stripe-account-onboarding",
  auth(UserRole.AGENT),
  PaymentController.stripeAccountOnboarding,
);

// checkout session on stripe
router.post(
  "/create-stripe-checkout-session/:tripServiceBookingId",
  optionalAuth(),
  PaymentController.createStripeCheckoutSession,
);

// stripe webhook payment
// localhost:5000/api/v1/payments/webhook
// https://api.tourenzo.com/api/v1/payments/webhook
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // important: keep raw body
  PaymentController.stripeHandleWebhook,
);

// cancel booking stripe
router.post(
  "/stripe-cancel-booking/:tripServiceBookingId",
  auth(UserRole.USER, UserRole.AGENT),
  PaymentController.cancelStripeBooking,
);

export const paymentRoutes = router;
