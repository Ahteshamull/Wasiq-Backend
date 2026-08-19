// ১. কাস্টম ইউনিক বুকিং আইডি জেনারেটর
const generateCustomBookingId = (booking: any): string => {
  const service = (booking.serviceType || "BKG").substring(0, 3).toUpperCase();
  const cleanFrom = (booking.from || "").replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase();
  const cleanTo = (booking.to || "").replace(/[^a-zA-Z]/g, "").substring(0, 3).toUpperCase();
  const fromLoc = cleanFrom.length >= 2 ? cleanFrom : "LOC";
  const toLoc = cleanTo.length >= 2 ? cleanTo : "LOC";
  const idPart = booking.id ? booking.id.substring(booking.id.length - 6).toUpperCase() : "XXXXXX";
  return `${service}-${fromLoc}-${toLoc}-${idPart}`;
};

// ২. ডেট ফরম্যাটার হেল্পার
const formatDate = (date: any): string => {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(date);
  }
};

// ৩. টাইম স্লট ফরম্যাটার হেল্পার
const formatTimeSlot = (timeSlot: any): string => {
  if (!timeSlot) return "";
  if (typeof timeSlot === "string") return timeSlot;
  if (typeof timeSlot === "object") {
    const start = timeSlot.start;
    const end = timeSlot.end;
    if (start && end) {
      return start === end ? start : `${start} - ${end}`;
    }
    if (start) return start;
    if (end) return end;
    try {
      return JSON.stringify(timeSlot);
    } catch {
      return "";
    }
  }
  return "";
};

export const generateBookingCreatedUserEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="background-color: #f5f7fa; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background-color: #0f294a; padding: 25px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1.5px;">WASIK TRANSFERS</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Professional Transfer & Booking</p>
        </div>

        <div style="padding: 30px;">
          <!-- Headline / Greeting -->
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background-color: #fef3c7; color: #d97706; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Booking Pending Payment</span>
            <h2 style="color: #0f294a; margin: 15px 0 5px 0; font-size: 20px;">Booking Created Successfully!</h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Dear <strong>${booking.clientName || booking.user?.fullName || "Valued Customer"}</strong>, your transfer booking is ready. Please complete payment to confirm.</p>
          </div>

          <!-- Grid Info (Outlook-friendly table) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
            <tr>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Date:</strong> ${formatDate(booking.travelDate)}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Time:</strong> ${booking.timeSlot ? formatTimeSlot(booking.timeSlot) : "N/A"}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Passengers:</strong> ${booking.passengers} Pax</p>
                <p style="margin: 0; font-size: 13px;"><strong>Service:</strong> ${booking.serviceType}</p>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Invoice</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f294a;">${generateCustomBookingId(booking)}</span></p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking Date:</strong> ${formatDate(new Date())}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="color: #d97706; font-weight: 600;">Pending</span></p>
                <p style="margin: 0; font-size: 13px;"><strong>Trip Name:</strong> ${bookingTitle}</p>
              </td>
            </tr>
          </table>

          <!-- Route Info -->
          <div style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #edf2f7; margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Trip Route</h4>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40%" style="font-size: 13px; font-weight: 600; color: #0f294a; line-height: 1.4;">${booking.from}</td>
                <td width="20%" align="center" style="font-size: 18px; color: #64748b;">➔</td>
                <td width="40%" style="font-size: 13px; font-weight: 600; color: #0f294a; text-align: right; line-height: 1.4;">${booking.to}</td>
              </tr>
            </table>
          </div>

          <!-- Pricing Table -->
          <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Price Breakdown</h4>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #0f294a; color: #ffffff;">
                <th align="left" style="padding: 10px 12px; font-size: 12px; border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Description</th>
                <th align="right" style="padding: 10px 12px; font-size: 12px; border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${booking.basePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Base Price (Route)</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.basePrice}</td>
              </tr>
              ` : ""}
              ${booking.vehiclePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Vehicle Class Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.vehiclePrice}</td>
              </tr>
              ` : ""}
              ${booking.stoppagePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Stoppages/Stops Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.stoppagePrice}</td>
              </tr>
              ` : ""}
              ${booking.returnPrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Return Journey Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.returnPrice}</td>
              </tr>
              ` : ""}
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-weight: bold; color: #0f294a; font-size: 14px; border-bottom-left-radius: 6px; border-top-left-radius: 6px;">Total Price (USD)</td>
                <td align="right" style="padding: 12px; font-weight: bold; color: #0f294a; font-size: 16px; border-bottom-right-radius: 6px; border-top-right-radius: 6px;">$${booking.totalPrice}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer/Brand Support -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 5px 0;">If you have any questions regarding your booking, please reach out to our customer support.</p>
            <p style="margin: 0; font-weight: 600; color: #0f294a;">Wasik Support | info@wasiktransfers.com</p>
          </div>
        </div>

      </div>
    </div>
  `;
};

export const generateBookingCreatedAdminEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="background-color: #f5f7fa; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background-color: #0f294a; padding: 25px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1.5px;">WASIK TRANSFERS</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Professional Transfer & Booking</p>
        </div>

        <div style="padding: 30px;">
          <!-- Headline / Greeting -->
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background-color: #e0f2fe; color: #0369a1; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">New Booking Received</span>
            <h2 style="color: #0f294a; margin: 15px 0 5px 0; font-size: 20px;">New Booking Details</h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">A new booking has been created on Wasik Transfers by <strong>${booking.clientName || booking.user?.fullName || "Guest User"}</strong> (${booking.user?.email || "No Email"}).</p>
          </div>

          <!-- Grid Info (Outlook-friendly table) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
            <tr>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Date:</strong> ${formatDate(booking.travelDate)}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Time:</strong> ${booking.timeSlot ? formatTimeSlot(booking.timeSlot) : "N/A"}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Passengers:</strong> ${booking.passengers} Pax</p>
                <p style="margin: 0; font-size: 13px;"><strong>Service:</strong> ${booking.serviceType}</p>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Invoice</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f294a;">${generateCustomBookingId(booking)}</span></p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking Date:</strong> ${formatDate(new Date())}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="color: #0369a1; font-weight: 600;">Pending</span></p>
                <p style="margin: 0; font-size: 13px;"><strong>Trip Name:</strong> ${bookingTitle}</p>
              </td>
            </tr>
          </table>

          <!-- Route Info -->
          <div style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #edf2f7; margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Trip Route</h4>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40%" style="font-size: 13px; font-weight: 600; color: #0f294a; line-height: 1.4;">${booking.from}</td>
                <td width="20%" align="center" style="font-size: 18px; color: #64748b;">➔</td>
                <td width="40%" style="font-size: 13px; font-weight: 600; color: #0f294a; text-align: right; line-height: 1.4;">${booking.to}</td>
              </tr>
            </table>
          </div>

          <!-- Pricing Table -->
          <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Price Breakdown</h4>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #0f294a; color: #ffffff;">
                <th align="left" style="padding: 10px 12px; font-size: 12px; border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Description</th>
                <th align="right" style="padding: 10px 12px; font-size: 12px; border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${booking.basePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Base Price (Route)</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.basePrice}</td>
              </tr>
              ` : ""}
              ${booking.vehiclePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Vehicle Class Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.vehiclePrice}</td>
              </tr>
              ` : ""}
              ${booking.stoppagePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Stoppages/Stops Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.stoppagePrice}</td>
              </tr>
              ` : ""}
              ${booking.returnPrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Return Journey Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.returnPrice}</td>
              </tr>
              ` : ""}
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-weight: bold; color: #0f294a; font-size: 14px; border-bottom-left-radius: 6px; border-top-left-radius: 6px;">Total Price (USD)</td>
                <td align="right" style="padding: 12px; font-weight: bold; color: #0f294a; font-size: 16px; border-bottom-right-radius: 6px; border-top-right-radius: 6px;">$${booking.totalPrice}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer/Brand Support -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 5px 0;">This is an administrative notification email generated automatically by Wasik Transfers.</p>
            <p style="margin: 0; font-weight: 600; color: #0f294a;">Wasik Admin Panel</p>
          </div>
        </div>

      </div>
    </div>
  `;
};

export const generateBookingConfirmedEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="background-color: #f5f7fa; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background-color: #0f294a; padding: 25px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1.5px;">WASIK TRANSFERS</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Professional Transfer & Booking</p>
        </div>

        <div style="padding: 30px;">
          <!-- Headline / Greeting -->
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background-color: #d1fae5; color: #059669; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Booking Confirmed</span>
            <h2 style="color: #0f294a; margin: 15px 0 5px 0; font-size: 20px;">Booking Paid Successfully!</h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Dear <strong>${booking.clientName || booking.user?.fullName || "Valued Customer"}</strong>, your payment has been successfully processed and your transfer is now confirmed.</p>
          </div>

          <!-- Grid Info (Outlook-friendly table) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
            <tr>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Date:</strong> ${formatDate(booking.travelDate)}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Time:</strong> ${booking.timeSlot ? formatTimeSlot(booking.timeSlot) : "N/A"}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Passengers:</strong> ${booking.passengers} Pax</p>
                <p style="margin: 0; font-size: 13px;"><strong>Service:</strong> ${booking.serviceType}</p>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Invoice</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f294a;">${generateCustomBookingId(booking)}</span></p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking Date:</strong> ${formatDate(new Date())}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Confirmed</span></p>
                <p style="margin: 0; font-size: 13px;"><strong>Trip Name:</strong> ${bookingTitle}</p>
              </td>
            </tr>
          </table>

          <!-- Route Info -->
          <div style="background-color: #f8fafc; padding: 15px 20px; border-radius: 10px; border: 1px solid #edf2f7; margin-bottom: 25px;">
            <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Trip Route</h4>
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40%" style="font-size: 13px; font-weight: 600; color: #0f294a; line-height: 1.4;">${booking.from}</td>
                <td width="20%" align="center" style="font-size: 18px; color: #64748b;">➔</td>
                <td width="40%" style="font-size: 13px; font-weight: 600; color: #0f294a; text-align: right; line-height: 1.4;">${booking.to}</td>
              </tr>
            </table>
          </div>

          <!-- Pricing Table -->
          <h4 style="margin: 0 0 10px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Payment Summary</h4>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-bottom: 25px;">
            <thead>
              <tr style="background-color: #0f294a; color: #ffffff;">
                <th align="left" style="padding: 10px 12px; font-size: 12px; border-top-left-radius: 6px; border-bottom-left-radius: 6px;">Description</th>
                <th align="right" style="padding: 10px 12px; font-size: 12px; border-top-right-radius: 6px; border-bottom-right-radius: 6px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${booking.basePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Base Price (Route)</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.basePrice}</td>
              </tr>
              ` : ""}
              ${booking.vehiclePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Vehicle Class Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.vehiclePrice}</td>
              </tr>
              ` : ""}
              ${booking.stoppagePrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Stoppages/Stops Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.stoppagePrice}</td>
              </tr>
              ` : ""}
              ${booking.returnPrice ? `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px;">Return Journey Fee</td>
                <td align="right" style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 600;">$${booking.returnPrice}</td>
              </tr>
              ` : ""}
              <tr style="background-color: #f8fafc;">
                <td style="padding: 12px; font-weight: bold; color: #059669; font-size: 14px; border-bottom-left-radius: 6px; border-top-left-radius: 6px;">Amount Paid (USD)</td>
                <td align="right" style="padding: 12px; font-weight: bold; color: #059669; font-size: 16px; border-bottom-right-radius: 6px; border-top-right-radius: 6px;">$${booking.totalPrice}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer/Brand Support -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 5px 0;">We look forward to welcoming you on board. For any questions, please contact our support.</p>
            <p style="margin: 0; font-weight: 600; color: #0f294a;">Wasik Support | info@wasiktransfers.com</p>
          </div>
        </div>

      </div>
    </div>
  `;
};

export const generateBookingCancelledEmailTemplate = (booking: any): string => {
  const bookingTitle = booking.tripService?.title || `${booking.from} to ${booking.to}`;
  return `
    <div style="background-color: #f5f7fa; padding: 30px 15px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; min-height: 100%;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background-color: #0f294a; padding: 25px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 1.5px;">WASIK TRANSFERS</h1>
          <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Professional Transfer & Booking</p>
        </div>

        <div style="padding: 30px;">
          <!-- Headline / Greeting -->
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="background-color: #fee2e2; color: #dc2626; padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Booking Cancelled & Refunded</span>
            <h2 style="color: #0f294a; margin: 15px 0 5px 0; font-size: 20px;">Your Booking has been Cancelled</h2>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Dear <strong>${booking.clientName || booking.user?.fullName || "Valued Customer"}</strong>, we confirm that your booking for <strong>${bookingTitle}</strong> has been cancelled and a full refund has been initiated to your original payment method.</p>
          </div>

          <!-- Grid Info (Outlook-friendly table) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 25px;">
            <tr>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Details</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Date:</strong> ${formatDate(booking.travelDate)}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Time:</strong> ${booking.timeSlot ? formatTimeSlot(booking.timeSlot) : "N/A"}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Passengers:</strong> ${booking.passengers} Pax</p>
                <p style="margin: 0; font-size: 13px;"><strong>Service:</strong> ${booking.serviceType}</p>
              </td>
              <td width="4%">&nbsp;</td>
              <td width="48%" valign="top" style="background-color: #f8fafc; padding: 15px; border-radius: 10px; border: 1px solid #edf2f7;">
                <h4 style="margin: 0 0 8px 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking Invoice</h4>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #0f294a;">${generateCustomBookingId(booking)}</span></p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Booking Date:</strong> ${formatDate(new Date())}</p>
                <p style="margin: 0 0 4px 0; font-size: 13px;"><strong>Status:</strong> <span style="color: #dc2626; font-weight: 600;">Cancelled</span></p>
                <p style="margin: 0; font-size: 13px;"><strong>Refund Status:</strong> <span style="color: #059669; font-weight: 600;">Initiated</span></p>
              </td>
            </tr>
          </table>

          <!-- Footer/Brand Support -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0 0 5px 0;">Refunds typically take 5-10 business days to appear on your bank statement. If you have questions, please reach out to support.</p>
            <p style="margin: 0; font-weight: 600; color: #0f294a;">Wasik Support | info@wasiktransfers.com</p>
          </div>
        </div>

      </div>
    </div>
  `;
};

export const generateCustomerContactUserEmailTemplate = (payload: any): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333; text-align: center;">Thank You for Contacting Us!</h2>
      <p style="color: #666; line-height: 1.6;">
        Dear \${payload.fullName},
      </p>
      <p style="color: #666; line-height: 1.6;">
        We have successfully received your message regarding "<strong>\${payload.subject}</strong>". 
        Our team will review your inquiry and get back to you as soon as possible.
      </p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Your Contact Details:</h3>
        <p style="color: #666; margin: 5px 0;"><strong>Name:</strong> \${payload.fullName}</p>
        <p style="color: #666; margin: 5px 0;"><strong>Email:</strong> \${payload.email}</p>
        <p style="color: #666; margin: 5px 0;"><strong>Phone:</strong> \${payload.contactNumber}</p>
        <p style="color: #666; margin: 5px 0;"><strong>Subject:</strong> \${payload.subject}</p>
        \${payload.description ? \`<p style="color: #666; margin: 5px 0;"><strong>Message:</strong> \${payload.description}</p>\` : ""}
      </div>
      <p style="color: #666; line-height: 1.6;">
        We typically respond within 24-48 hours during business days. If your matter is urgent, 
        please don't hesitate to call us directly.
      </p>
      <p style="color: #666; line-height: 1.6;">
        Best regards,<br>
        The Customer Support Team
      </p>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    </div>
  `;
};

export const generateCustomerContactAdminEmailTemplate = (payload: any): string => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #d32f2f; text-align: center; margin-bottom: 20px;">New Contact Message Received</h2>
      <p style="color: #333; line-height: 1.6;">
        Hello Admin,
      </p>
      <p style="color: #666; line-height: 1.6;">
        A customer has submitted a contact form on Wasik Transfers. Here are the details of the submission:
      </p>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
        <h3 style="color: #333; margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">Submission Information:</h3>
        <p style="color: #333; margin: 8px 0;"><strong>Full Name:</strong> \${payload.fullName}</p>
        <p style="color: #333; margin: 8px 0;"><strong>Email Address:</strong> <a href="mailto:\${payload.email}" style="color: #1a73e8;">\${payload.email}</a></p>
        <p style="color: #333; margin: 8px 0;"><strong>Contact Number:</strong> \${payload.contactNumber}</p>
        <p style="color: #333; margin: 8px 0;"><strong>Subject:</strong> \${payload.subject}</p>
        \${payload.description ? \`
        <div style="margin-top: 15px;">
          <strong>Message/Description:</strong>
          <p style="color: #555; background-color: #fff; padding: 10px; border: 1px solid #e0e0e0; border-radius: 4px; margin-top: 5px; white-space: pre-wrap;">\${payload.description}</p>
        </div>
        \` : ""}
      </div>
      <p style="color: #666; line-height: 1.6;">
        Please reply to this inquiry directly at <a href="mailto:\${payload.email}">\${payload.email}</a>.
      </p>
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 11px; margin: 0;">
          Wasik Transfers Notification Service
        </p>
      </div>
    </div>
  `;
};
