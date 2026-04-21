import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { PaymentService } from "./payment.sercice";
import ApiError from "../../../errors/ApiErrors";
import config from "../../../config";
import stripe from "../../../helpars/stripe";
import Stripe from "stripe";

// stripe account onboarding
const stripeAccountOnboarding = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const result = await PaymentService.stripeAccountOnboarding(userId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stripe account onboarding successfully",
      data: result,
    });
  },
);

// checkout session on stripe
const createStripeCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { tripServiceBookingId } = req.params;
    const { description } = req.body;

    const result = await PaymentService.createStripeCheckoutSession(
      userId,
      tripServiceBookingId,
      description,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Checkout session created successfully",
      data: result,
    });
  },
);

// stripe webhook payment
const stripeHandleWebhook = catchAsync(async (req: Request, res: Response) => {
  console.log("🔔 Webhook received! Checking signature...");
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    console.error("❌ Webhook Error: Missing stripe signature in headers");
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing stripe signature", "");
  }

  let event: Stripe.Event;

  try {
    if (!req.rawBody) {
      console.error("❌ Webhook Error: Raw body not available");
      throw new ApiError(httpStatus.BAD_REQUEST, "Raw body not available", "");
    }

    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      config.stripe.webhookSecret as string,
    );
    console.log(`✅ Webhook verified successfully! Event Type: ${event.type}`);
  } catch (err: any) {
    console.error(`❌ Webhook Error Verification Failed: ${err.message}`);
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Webhook Error: ${err.message}`,
      "",
    );
  }

  const result = await PaymentService.stripeHandleWebhook(event);
  console.log(`🎉 Webhook event ${event.type} processed successfully`);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stripe webhook payment successfully",
    data: event,
  });
});

// stripe cancel booking
const cancelStripeBooking = catchAsync(async (req, res) => {
  const { serviceType, bookingId } = req.params;
  const userId = req.user?.id;

  // const result = await PaymentService.cancelStripeBooking(
  //   serviceType,
  //   bookingId,
  //   userId
  // );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking cancelled successfully",
    data: "",
  });
});

// get my all my transactions
const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await PaymentService.getMyTransactions(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My transactions fetched successfully",
    data: result,
  });
});

export const PaymentController = {
  stripeAccountOnboarding,
  stripeHandleWebhook,
  cancelStripeBooking,
  getMyTransactions,
  createStripeCheckoutSession,
};
