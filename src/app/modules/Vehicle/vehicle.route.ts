import { Router } from "express";
import { VehicleController } from "./vehicle.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { VehicleValidation } from "./vehicle.validation";
import validateRequest from "../../middlewares/validateRequest";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = Router();

// create vehicle (admin only)
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 10 }]),
  parseBodyData,
  validateRequest(VehicleValidation.createVehicleValidation),
  VehicleController.createVehicle,
);

// get all vehicles (public)
router.get("/", VehicleController.getAllVehicles);

// get single vehicle (public)
router.get("/:id", VehicleController.getSingleVehicle);

// update vehicle (admin only)
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 10 }]),
  parseBodyData,
  validateRequest(VehicleValidation.updateVehicleValidation),
  VehicleController.updateVehicle,
);

// delete vehicle (admin only)
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  VehicleController.deleteVehicle,
);

export const vehicleRoutes = router;
