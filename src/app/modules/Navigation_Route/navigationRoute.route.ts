import express from "express";
import { NavigationRouteController } from "./navigationRoute.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

// Get all navigation routes (publicly accessible with optional role filter)
router.get(
  "/get-all-navigation-routes",
  NavigationRouteController.getAllNavigationRoutes
);

// Update a navigation route (Admin only)
router.patch(
  "/update-navigation-route/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  NavigationRouteController.updateNavigationRoute
);

// Seed default routes (Admin only or system initialization)
router.post(
  "/seed-default-routes",
  NavigationRouteController.seedDefaultRoutes
);

export const navigationRouteRoutes = router;
