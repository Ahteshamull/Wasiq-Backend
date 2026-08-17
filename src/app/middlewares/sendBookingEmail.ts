import { Request, Response, NextFunction } from "express";
import emailSender from "../../helpars/emailSender";
import prisma from "../../shared/prisma";
import { UserRole } from "@prisma/client";
import {
  generateBookingCreatedUserEmailTemplate,
  generateBookingCreatedAdminEmailTemplate,
} from "../../shared/utils/emailTemplates";

export const sendBookingEmail = async (req: Request, res: Response, next: NextFunction) => {
  // We can just proceed, but we will send the emails asynchronously.
  const result = res.locals.bookingResult;
  if (!result) {
    return next();
  }

  // Do not call next() here because the response has already been sent in the controller.
  // Calling next() would trigger the 404 middleware and throw "Cannot set headers after they are sent" error,
  // which can interrupt the asynchronous email sending process.

  try {
    const { user, tripService, from, to, travelDate, timeSlot, passengers, serviceType, totalPrice } = result;
    const findUser = user;

    // Generate Email Content for User
    const userEmailContent = generateBookingCreatedUserEmailTemplate(result);

    // Send Email to User
    if (findUser.email) {
      try {
        await emailSender("Booking Created Successfully", findUser.email, userEmailContent);
      } catch (error) {
        console.error("Failed to send booking email to user", error);
      }
    }

    // Generate Email Content for Admin
    const adminEmailContent = generateBookingCreatedAdminEmailTemplate(result);

    // Send Email to Admin(s)
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { email: true }
    });

    for (const admin of admins) {
      if (admin.email) {
        try {
          await emailSender("New Booking Received", admin.email, adminEmailContent);
        } catch (error) {
          console.error("Failed to send booking email to admin", error);
        }
      }
    }
  } catch (error) {
    console.error("Error in sendBookingEmail middleware:", error);
  }
};
