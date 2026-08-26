import cron from "node-cron";
import prisma from "../../shared/prisma";
import { BookingStatus } from "@prisma/client";

// run the job every minute
export const startBookingExpiryChecker = () => {
  cron.schedule("* * * * *", async () => {
    // console.log("🔄 Running booking expiry checker...");

    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      // Find all PENDING bookings that are older than 5 minutes
      const expiredBookings = await prisma.tripServiceBooking.findMany({
        where: {
          status: BookingStatus.PENDING,
          createdAt: { lt: fiveMinutesAgo },
        },
      });

      if (expiredBookings.length > 0) {
        for (const booking of expiredBookings) {
          await prisma.$transaction(
            async (tx) => {
              // Delete related BookingVehicles
              await tx.bookingVehicle.deleteMany({
                where: { bookingId: booking.id },
              });

              // Delete related BookingStoppages
              await tx.bookingStoppage.deleteMany({
                where: { bookingId: booking.id },
              });

              // Delete related unpaid Payments (if any exists)
              await tx.payment.deleteMany({
                where: { tripServiceBookingId: booking.id },
              });

              // Delete the booking itself
              await tx.tripServiceBooking.delete({
                where: { id: booking.id },
              });
            },
            {
              maxWait: 10000,
              timeout: 25000,
            }
          );


          console.log(` Auto-removed expired PENDING booking: ${booking.id}`);
        }
      }
    } catch (error) {
      console.error("Booking expiry job failed:", error);
    }
  });
};
