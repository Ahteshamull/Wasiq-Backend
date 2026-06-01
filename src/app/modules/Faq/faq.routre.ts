import express from "express";
import { FaqController } from "./faq.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { FaqValidation } from "./faq.validation";

const router = express.Router();

// create faq
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(FaqValidation.createFaqValidation),
  FaqController.createFaq
);

// get all faq
router.get("/", FaqController.getAllFaq);

// get single faq
router.get("/:id", FaqController.getSingleFaq);

// update only faq
router.patch(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  validateRequest(FaqValidation.updateFaqValidation),
  FaqController.updateFaq
);

// delete faq
router.delete(
  "/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  FaqController.deleteFaq
);

router.get(
  "/service/:serviceType",
  FaqController.getFaqByServiceType
);

export const faqRoutes = router;
