import express from "express";

import { authRoutes } from "../modules/Auth/auth.routes";
import { userRoute } from "../modules/User/user.route";
import { privacyPolicyRoute } from "../modules/Privacy_Policy/policy.route";
import { settingRoute } from "../modules/Setting/setting.route";
import { termsConditionRoute } from "../modules/Terms_Condition/terms.route";
import { paymentRoutes } from "../modules/Payment/payment.route";
import { supportRoutes } from "../modules/Support/support.route";
import { refundPolicyRoute } from "../modules/Refund_Policy/refund_policy.route";
import { cancelReservationRoute } from "../modules/Cancel_Reservation/cancel_reservation.route";
import { faqRoutes } from "../modules/Faq/faq.routre";
import { messageRoutes } from "../modules/Message/message.route";
import { notificationsRoute } from "../modules/Notification/notification.route";
import { tripServiceRoutes } from "../modules/Trip_Service/tripService.route";
import { vehicleRoutes } from "../modules/Vehicle/vehicle.route";
import { blogRoutes } from "../modules/Blog/blog.route";
import { customerContactRoutes } from "../modules/CustomerContact/customerContact.route";
import { tripServiceBookingRoute } from "../modules/TripService_booking/tripServiceBooking.route";
import { StoppageRoutes } from "../modules/Stoppage/stoppage.route";
import { statisticsRoutes } from "../modules/Statistics/statistics.route";
import { newsletterRoutes } from "../modules/Newsletter/newsletter.route";
import { reviewRoute } from "../modules/Review/review.route";
import { MemoryRoutes } from "../modules/Memory/memory.route";
import { navigationRouteRoutes } from "../modules/Navigation_Route/navigationRoute.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoute,
  },
  {
    path: "/auth",
    route: authRoutes,
  },

  {
    path: "/trip-services",
    route: tripServiceRoutes,
  },
  {
    path: "/trip-service-booking",
    route: tripServiceBookingRoute,
  },
  {
    path: "/trip-service-bookings",
    route: tripServiceBookingRoute,
  },

  {
    path: "/vehicles",
    route: vehicleRoutes,
  },

  {
    path: "/stoppages",
    route: StoppageRoutes,
  },

  {
    path: "/blogs",
    route: blogRoutes,
  },
  {
    path: "/statistics",
    route: statisticsRoutes,
  },

  {
    path: "/notifications",
    route: notificationsRoute,
  },
  {
    path: "/faqs",
    route: faqRoutes,
  },
  {
    path: "/newsletters",
    route: newsletterRoutes,
  },

  {
    path: "/cancel-reservations",
    route: cancelReservationRoute,
  },
  {
    path: "/refund-policies",
    route: refundPolicyRoute,
  },
  {
    path: "/terms-conditions",
    route: termsConditionRoute,
  },
  {
    path: "/policy",
    route: privacyPolicyRoute,
  },

  {
    path: "/reviews",
    route: reviewRoute,
  },
  {
    path: "/settings",
    route: settingRoute,
  },

  {
    path: "/messages",
    route: messageRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes,
  },
  {
    path: "/reports",
    route: supportRoutes,
  },
  {
    path: "/customer-contacts",
    route: customerContactRoutes,
  },
  {
    path: "/memories",
    route: MemoryRoutes,
  },
  {
    path: "/navigation-routes",
    route: navigationRouteRoutes,
  },
];


moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
