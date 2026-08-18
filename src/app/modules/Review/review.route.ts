import express from "express";
import { ReviewController } from "./review.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = express.Router();

//localhost:5000/api/v1/review/service
router.post(
  "/service",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT),
  uploadFile.upload.fields([{ name: "image", maxCount: 10 }]),
  parseBodyData,
  ReviewController.createTripServiceReview,
);

//localhost:5000/api/v1/review/service-all-reviews

router.get("/service-all-reviews",  ReviewController.getAllReviews);

// update review status
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ReviewController.updateReviewStatus,
);



export const reviewRoute = router;
