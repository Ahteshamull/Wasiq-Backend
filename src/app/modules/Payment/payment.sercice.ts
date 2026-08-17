import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import stripe from "../../../helpars/stripe";
import {
  BookingStatus,
  EveryServiceStatus,
  PaymentStatus,
  UserStatus,
  UserRole,
} from "@prisma/client";
import config from "../../../config";
import Stripe from "stripe";
import emailSender from "../../../helpars/emailSender";
import { generateBookingConfirmedEmailTemplate } from "../../../shared/utils/emailTemplates";

// stripe account onboarding
const stripeAccountOnboarding = async (userId: string) => {
  // find user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // if user already has stripe account
  if (user.stripeAccountId) {
    const account = await stripe.accounts.retrieve(user.stripeAccountId);

    const cardPayments = account.capabilities?.card_payments;
    const transfers = account.capabilities?.transfers;
    const requirements = account.requirements?.currently_due || [];

    // if verified
    if (cardPayments === "active" && transfers === "active") {
      // update DB to mark as connected
      await prisma.user.update({
        where: { id: user.id },
        data: { isStripeConnected: true },
      });

      return {
        status: "verified",
        message: "Stripe account verified successfully.",
        capabilities: account.capabilities,
      };
    }

    // if not verified → generate onboarding link
    const accountLinks = await stripe.accountLinks.create({
      account: user.stripeAccountId,
      refresh_url: `${config.stripe.refreshUrl}?accountId=${user.stripeAccountId}`,
      return_url: `${config.stripe.returnUrl}?accountId=${user.stripeAccountId}`,
      type: "account_onboarding",
    });

    // update DB to store stripeAccountId & mark connected
    await prisma.user.update({
      where: { id: user.id },
      data: {
        stripeAccountId: user.stripeAccountId,
        isStripeConnected: true,
      },
    });

    return {
      status: requirements.length > 0 ? "requirements_due" : "pending",
      message:
        requirements.length > 0
          ? "Additional information required for Stripe verification."
          : "Your Stripe account verification is under review.",
      requirements,
      onboardingLink: accountLinks.url,
    };
  }

  // if user has no stripe account → create new account
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: user?.email,
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        schedule: {
          delay_days: 2, // minimum allowed
        },
      },
    },
  });

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${config.stripe.refreshUrl}?accountId=${account.id}`,
    return_url: `${config.stripe.returnUrl}?accountId=${account.id}`,
    type: "account_onboarding",
  });

  // update DB with stripeAccountId & mark connected
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeAccountId: account.id,
      isStripeConnected: true,
    },
  });

  return {
    status: "pending",
    message: "Your Stripe account verification is under review.",
    capabilities: account.capabilities,
    onboardingLink: accountLink.url,
  };
};

// checkout session on stripe
const createStripeCheckoutSession = async (
  userId: string | undefined,
  tripServiceBookingId: string,
  description: string,
) => {
  // find booking first
  const booking = await prisma.tripServiceBooking.findUnique({
    where: { id: tripServiceBookingId },
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // ownership check (only if authenticated)
  if (userId) {
    const loggedInUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isBookingOwner = booking.userId === userId;
    const isAdmin =
      loggedInUser?.role === UserRole.ADMIN ||
      loggedInUser?.role === UserRole.SUPER_ADMIN;
    const isAgent = loggedInUser?.role === UserRole.AGENT;

    if (!isBookingOwner && !isAdmin && !isAgent) {
      throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized booking");
    }
  }

  const finalUserId = booking.userId;
  if (!finalUserId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booking does not have an associated user",
    );
  }

  // find user with role
  const user = await prisma.user.findUnique({
    where: { id: finalUserId },
    select: {
      id: true,
      email: true,
      role: true,
      stripeAccountId: true,
      isStripeConnected: true,
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // prevent duplicate payment
  if (booking.status === BookingStatus.CONFIRMED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Booking already paid");
  }

  // check agent onboarding for AGENT role
  if (user.role === UserRole.AGENT && !user.isStripeConnected) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Agent must complete Stripe onboarding first",
    );
  }

  // commission based on user role
  let adminCommission = 0;
  let agentCommission = 0;

  if (user.role === UserRole.AGENT) {
    // agent: 85% admin, 15% agent
    adminCommission = booking.totalPrice * 0.85;
    agentCommission = booking.totalPrice * 0.15;
  } else {
    // user: 100% admin
    adminCommission = booking.totalPrice;
  }

  const amount = Math.round(booking.totalPrice * 100);

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",

    line_items: [
      {
        price_data: {
          currency: "EUR",
          product_data: {
            name: "Trip Service Booking",
            description: description || "Trip Service Payment",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],

    success_url: config.stripe.checkout_success_url,
    cancel_url: config.stripe.checkout_cancel_url,

    metadata: {
      userId: finalUserId,
      tripServiceBookingId,
    },
  });

  await prisma.payment.create({
    data: {
      amount: booking.totalPrice,
      admin_commission: adminCommission,
      agent_commission: agentCommission,
      currency: "EUR",
      description,
      sessionId: checkoutSession.id,
      paymentIntentId: null,
      status: PaymentStatus.UNPAID,
      serviceType: booking.serviceType,
      user_role: booking.user_role || user.role,
      userId: finalUserId,
      tripServiceBookingId: booking.id,
      tripServiceId: booking.tripServiceId,
    },
  });

  return {
    id: checkoutSession.id,
    url: checkoutSession.url,
  };
};

// stripe handle webhook
const stripeHandleWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const sessionId = session.id;
      const paymentIntentId = session.payment_intent as string;

      if (!paymentIntentId) break;

      // find payment record
      const payment = await prisma.payment.findFirst({
        where: { sessionId },
      });

      if (!payment) break;

      // duplicate protection
      if (payment.status === PaymentStatus.PAID) break;

      // retrieve payment intent from Stripe
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      // amount validation
      if (paymentIntent.amount_received !== payment.amount * 100) {
        throw new Error("Payment amount mismatch");
      }

      // get user info for agent transfer
      const user = await prisma.user.findUnique({
        where: { id: payment.userId },
        select: { role: true, stripeAccountId: true },
      });

      // build transaction operations
      const transactionOps = [
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            paymentIntentId,
            status: PaymentStatus.PAID,
          },
        }),

        prisma.tripServiceBooking.update({
          where: { id: payment.tripServiceBookingId! },
          data: {
            status: BookingStatus.CONFIRMED,
          },
        }),
      ];

      // only update tripService if tripServiceId exists
      if (payment.tripServiceId) {
        transactionOps.push(
          prisma.tripService.update({
            where: { id: payment.tripServiceId },
            data: {
              isService: EveryServiceStatus.BOOKED,
            },
          }) as any,
        );
      }

      // transaction update
      await prisma.$transaction(transactionOps);

      // Send booking confirmation email
      try {
        const bookingDetails = await prisma.tripServiceBooking.findUnique({
          where: { id: payment.tripServiceBookingId! },
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
            tripService: {
              select: {
                title: true,
              },
            },
          },
        });

        const recipientEmail = bookingDetails?.user?.email;

        if (bookingDetails && recipientEmail) {
          const emailHtml =
            generateBookingConfirmedEmailTemplate(bookingDetails);
          await emailSender(
            "Booking Confirmed Successfully",
            recipientEmail,
            emailHtml,
          );
        }
      } catch (emailError) {
        console.error("Error sending booking confirmation email:", emailError);
      }

      // handle agent transfer if user is AGENT and has stripe account
      if (
        user?.role === UserRole.AGENT &&
        user.stripeAccountId &&
        payment.agent_commission &&
        payment.agent_commission > 0
      ) {
        try {
          await stripe.transfers.create({
            amount: Math.round(payment.agent_commission * 100), // convert to cents
            currency: "EUR",
            destination: user.stripeAccountId,
            metadata: {
              paymentId: payment.id,
              type: "agent_commission",
            },
          });

          // console.log("Agent transfer created:", transfer.id);
        } catch (transferError) {
          console.error("Failed to create agent transfer:", transferError);
          // don't fail the payment, just log the error
        }
      }

      break;
    }

    default:
      // console.log("Event ignored:", event.type);
      break;
  }
};

// get my all my transactions
const getMyTransactions = async (userId: string) => {
  const transactions = await prisma.payment.findMany({
    where: { userId, status: PaymentStatus.PAID },
  });

  if (!transactions || transactions.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No transactions found");
  }

  return transactions;
};

export const PaymentService = {
  stripeAccountOnboarding,
  createStripeCheckoutSession,
  stripeHandleWebhook,
  getMyTransactions,
};
