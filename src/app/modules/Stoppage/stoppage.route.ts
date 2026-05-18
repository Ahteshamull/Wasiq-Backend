import { Router } from "express";
import { StoppageController } from "./stoppage.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { StoppageValidation } from "./stoppage.validation";
import validateRequest from "../../middlewares/validateRequest";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = Router();

// create stoppage (admin only)
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(StoppageValidation.createStoppageValidation),
  StoppageController.createStoppage,
);

// get all stoppages (public)
router.get("/", StoppageController.getAllStoppages);

router.get(
  "/from-location/:location",
  StoppageController.getStoppagesByFromLocation,
);

// get single stoppage (public)
router.get("/:id", StoppageController.getSingleStoppage);

// update stoppage (admin only)
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(StoppageValidation.updateStoppageValidation),
  StoppageController.updateStoppage,
);

// delete stoppage (admin only)
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  StoppageController.deleteStoppage,
);
// router.post(
//   "/search-stoppage/popular",
//   validateRequest(StoppageValidation.SearchableStoppageSchema),
//   StoppageController.popularStoppage,
// );
router.post(
  "/search-stoppage",
  validateRequest(StoppageValidation.SearchableStoppageSchema),
  StoppageController.searchableStoppage,
);

router.post(
  "/add-extra-stoppage",
  validateRequest(StoppageValidation.AddExtraStoppageSchema),
  StoppageController.addExtraStoppage,
);

router.get("/single-stoppage/:id", StoppageController.getSingleStoppage);

export const StoppageRoutes = router;
