export const generateBookingCreatedUserEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">Booking Created</h2>
      <p>Dear <strong>${booking.clientName || booking.user?.fullName || "Valued Customer"}</strong>,</p>
      <p>Your booking for <strong>${bookingTitle}</strong> has been created successfully (Payment Pending).</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.from}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>To:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.to}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.travelDate} ${booking.timeSlot ? `at ${booking.timeSlot}` : ""}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Passengers:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.passengers}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.serviceType}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; color: #333;">Total Price:</td><td style="padding: 8px; font-weight: bold; color: #333;">$${booking.totalPrice}</td></tr>
      </table>
      <p style="margin-top: 20px;">Thank you for choosing our service! Please complete your payment to confirm your booking.</p>
    </div>
  `;
};

export const generateBookingCreatedAdminEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #FF5722; text-align: center;">New Booking Received</h2>
      <p>A new booking has been placed by <strong>${booking.clientName || booking.user?.fullName || "Guest User"}</strong> (${booking.user?.email || "No Email"}).</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${bookingTitle}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.from}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>To:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.to}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.travelDate} ${booking.timeSlot ? `at ${booking.timeSlot}` : ""}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Passengers:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.passengers}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; color: #333;">Total Price:</td><td style="padding: 8px; font-weight: bold; color: #333;">$${booking.totalPrice}</td></tr>
      </table>
    </div>
  `;
};

export const generateBookingConfirmedEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">Booking Confirmed! 🏨</h2>
      <p>Dear <strong>${booking.clientName || booking.user?.fullName || "Valued Customer"}</strong>,</p>
      <p>Your payment has been successfully processed and your booking for <strong>${bookingTitle}</strong> is now <strong>CONFIRMED</strong>.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Booking ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.id}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.from}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>To:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.to}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date & Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.travelDate} ${booking.timeSlot ? `at ${booking.timeSlot}` : ""}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Passengers:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.passengers}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Service Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.serviceType}</td></tr>
        <tr><td style="padding: 8px; font-weight: bold; color: #4CAF50;">Amount Paid:</td><td style="padding: 8px; font-weight: bold; color: #4CAF50;">$${booking.totalPrice}</td></tr>
      </table>
      <p style="margin-top: 20px;">We look forward to serving you! If you have any questions, please contact our support team.</p>
    </div>
  `;
};
