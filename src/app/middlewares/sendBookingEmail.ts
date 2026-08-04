import { Request, Response, NextFunction } from "express";
import emailSender from "../../helpars/emailSender";
import prisma from "../../shared/prisma";
import { UserRole } from "@prisma/client";

export const sendBookingEmail = async (req: Request, res: Response, next: NextFunction) => {
  // We can just proceed, but we will send the emails asynchronously.
  const result = res.locals.bookingResult;
  if (!result) {
    return next();
  }


  next();

  try {
    const { user, tripService, from, to, travelDate, timeSlot, passengers, serviceType, totalPrice } = result;
    const findUser = user;
    const bookingTitle = tripService?.title || `${from} to ${to}`;

    // Generate Email Content for User
    const userEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Booking Confirmation</h2>
        <p>Dear <strong>${findUser.fullName}</strong>,</p>
        <p>Your booking for <strong>${bookingTitle}</strong> has been created successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${from}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>To:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${to}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${travelDate} ${timeSlot ? `at ${timeSlot}` : ""}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Passengers:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${passengers}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${serviceType}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #333;">Total Price:</td><td style="padding: 8px; font-weight: bold; color: #333;">$${totalPrice}</td></tr>
        </table>
        <p style="margin-top: 20px;">Thank you for choosing our service!</p>
      </div>
    `;

    // Send Email to User
    if (findUser.email) {
      try {
        await emailSender("Booking Created Successfully", findUser.email, userEmailContent);
      } catch (error) {
        console.error("Failed to send booking email to user", error);
      }
    }

    // Generate Email Content for Admin
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #FF5722; text-align: center;">New Booking Received</h2>
        <p>A new booking has been placed by <strong>${findUser.fullName}</strong> (${findUser.email}).</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingTitle}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${from}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>To:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${to}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${travelDate} ${timeSlot ? `at ${timeSlot}` : ""}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Passengers:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${passengers}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; color: #333;">Total Price:</td><td style="padding: 8px; font-weight: bold; color: #333;">$${totalPrice}</td></tr>
        </table>
      </div>
    `;

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
