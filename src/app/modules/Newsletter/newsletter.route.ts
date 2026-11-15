import { Router } from "express";
import { NewsletterController } from "./newsletter.controller";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { NewsletterValidation } from "./newsletter.validation";

const router = Router();

// anyone can subscribe
router.post(
  "/",
  validateRequest(NewsletterValidation.createNewsletterSubscriberSchema),
  NewsletterController.createNewsletterSubscriber,
);

// admin only routes
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NewsletterController.getAllNewsletterSubscribers,
);

// admin only routes
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(NewsletterValidation.updateNewsletterSubscriberStatusSchema),
  NewsletterController.updateNewsletterSubscriberStatus,
);

// admin only routes
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NewsletterController.deleteNewsletterSubscriber,
);

// admin only routes
router.post(
  "/send-discount",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(NewsletterValidation.sendDiscountEmailSchema),
  NewsletterController.sendDiscountEmailToAllSubscribers,
);

// admin only routes
router.post(
  "/send-discount-single/:email",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(NewsletterValidation.sendDiscountEmailSchema),
  NewsletterController.sendDiscountEmailToSingleSubscriber,
);

export const newsletterRoutes = router;
