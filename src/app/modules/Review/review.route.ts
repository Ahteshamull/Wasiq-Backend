import express from "express";
import { ReviewController } from "./review.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

//localhost:5000/api/v1/review/service
router.post(
  "/service",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT),
  ReviewController.createTripServiceReview,
);

//localhost:5000/api/v1/review/service-all-reviews 

router.get(
  "/service-all-reviews",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT),
  ReviewController.getAllReviews,
);

// update review status
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReviewController.updateReviewStatus,
);

//get all active reviews

export const reviewRoute = router;
