import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import {
  IDiscountEmailData,
  INewsletterFilter,
  INewsletterResponse,
} from "./newsletter.interface";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import emailSender from "../../../helpars/emailSender";

// anyone can subscribe
const createNewsletterSubscriber = async (email: string) => {
  // check if email already exists
  const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existingSubscriber) {
    throw new ApiError(httpStatus.CONFLICT, "Email already subscribed");
  }

  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email,
    },
  });

  // send welcome email
  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Welcome to Our Newsletter!</h2>
      <p>Hi,</p>
      <p>Thank you for subscribing to our newsletter. You're now part of our community!</p>
      <p>You'll receive the latest updates, news, and exclusive content directly in your inbox.</p>
      <p>Stay tuned for exciting updates!</p>
      <p>Best regards,<br>Tourenzo Team</p>
    </div>
  `;

  await emailSender("Welcome to Our Newsletter!", email, welcomeHtml);

  return subscriber;
};

// admin only routes
const getAllNewsletterSubscribers = async (
  filters: INewsletterFilter,
  options: IPaginationOptions,
): Promise<INewsletterResponse> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);
  const { searchTerm, isActive } = filters;

  const andConditions = [];

  if (searchTerm) {
    andConditions.push({
      email: {
        contains: searchTerm,
      },
    });
  }

  if (isActive !== undefined) {
    andConditions.push({
      isActive: isActive,
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.newsletterSubscriber.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: subscribers,
  };
};

// admin only routes
const deleteNewsletterSubscriber = async (id: string) => {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { id },
  });

  if (!subscriber) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscriber not found");
  }

  await prisma.newsletterSubscriber.delete({
    where: { id },
  });

  return subscriber;
};

// admin only routes
const updateNewsletterSubscriberStatus = async (
  id: string,
  isActive: boolean,
) => {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: { id },
  });

  if (!subscriber) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscriber not found");
  }

  const updatedSubscriber = await prisma.newsletterSubscriber.update({
    where: { id },
    data: { isActive },
  });

  return updatedSubscriber;
};

// send discount email to all active subscribers
const sendDiscountEmailToAllSubscribers = async (
  discountData: IDiscountEmailData,
): Promise<{ sentCount: number; failedCount: number }> => {
  // get all active subscribers
  const activeSubscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      isActive: true,
    },
    select: {
      email: true,
    },
  });

  if (activeSubscribers.length === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, "No active subscribers found");
  }

  const discountHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; text-align: center; margin-bottom: 20px;">🎉 Special Discount Offer!</h1>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0;">${discountData.discountDescription}</p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>⏰ Hurry! Offer expires on: ${discountData.expiryDate}</strong></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${discountData.websiteUrl || "#"}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Shop Now & Save</a>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
          This offer is exclusively for our newsletter subscribers.<br>
          Don't miss out on this amazing deal!
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
          Best regards,<br>
          Tourenzo Team
        </p>
      </div>
    </div>
  `;

  let sentCount = 0;
  let failedCount = 0;

  // send email to each subscriber
  for (const subscriber of activeSubscribers) {
    try {
      await emailSender(
        discountData.subject ||
          `🎉 ${discountData.discountPercentage}% OFF - Special Discount!`,
        subscriber.email,
        discountHtml,
      );
      sentCount++;
    } catch (error) {
      console.error(`Failed to send email to ${subscriber.email}:`, error);
      failedCount++;
    }
  }

  return {
    sentCount,
    failedCount,
  };
};

// send discount email to single subscriber
const sendDiscountEmailToSingleSubscriber = async (
  email: string,
  discountData: IDiscountEmailData,
): Promise<{ success: boolean; message: string }> => {
  const discountHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; text-align: center; margin-bottom: 20px;">🎉 Special Discount Offer!</h1>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0;">${discountData.discountDescription}</p>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;"><strong>⏰ Hurry! Offer expires on: ${discountData.expiryDate}</strong></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${discountData.websiteUrl || "#"}" style="background-color: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Shop Now & Save</a>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
          This offer is exclusively for our newsletter subscribers.<br>
          Don't miss out on this amazing deal!
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
          Best regards,<br>
          Tourenzo Team
        </p>
      </div>
    </div>
  `;

  try {
    await emailSender(
      discountData.subject ||
        `🎉 ${discountData.discountPercentage}% OFF - Special Discount!`,
      email,
      discountHtml,
    );
    return {
      success: true,
      message: "Discount email sent successfully",
    };
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    return {
      success: false,
      message: "Failed to send discount email",
    };
  }
};

export const NewsletterService = {
  createNewsletterSubscriber,
  getAllNewsletterSubscribers,
  deleteNewsletterSubscriber,
  updateNewsletterSubscriberStatus,
  sendDiscountEmailToAllSubscribers,
  sendDiscountEmailToSingleSubscriber,
};
