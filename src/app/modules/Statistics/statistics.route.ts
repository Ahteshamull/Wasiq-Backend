import express from "express";
import { StatisticsController } from "./statistics.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";

const router = express.Router();

// get overview total users, total agents,total revenue
router.get(
  "/overview",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  StatisticsController.getOverview,
);

// get agent total earings and bookings
router.get(
  "/earnings-bookings-agent-dashboard",
  auth(UserRole.AGENT),
  StatisticsController.getAgentTotalEarningsAndBookings,
);

// get agent bookings
router.get(
  "/agent-bookings",
  auth(UserRole.AGENT, UserRole.USER),
  StatisticsController.getAgentBookings,
);

// get user bookings
router.get(
  "/user-bookings",
  auth(UserRole.USER),
  StatisticsController.getUserBookings,
);

// get user dashboard tab info
router.get(
  "/user-dashboard-tab-info",
  auth(UserRole.USER),
  StatisticsController.getUserDashboardTabInfo,
);

// admin total earnings
router.get(
  "/admin-earnings",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  StatisticsController.getAdminTotalEarnings,
);

// admin total reviews
router.get(
  "/admin-reviews",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  StatisticsController.getAdminTotalReviews,
);

// admin total bookings
router.get(
  "/admin-bookings",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  StatisticsController.getAdminTotalBookings,
);

export const statisticsRoutes = router;
