import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { MemoryValidation } from "./memory.validation";
import { MemoryController } from "./memory.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = express.Router();

// create memory
router.post(
  "/create-memory",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 20 }]),
  parseBodyData,
  validateRequest(MemoryValidation.createMemoryZodSchema),
  MemoryController.createMemory,
);

// get all memories
router.get(
  "/",
  MemoryController.getAllMemories,
);

// get single memory
router.get(
  "/:id",
  MemoryController.getSingleMemory,
);

// update memory
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 20 }]),
  parseBodyData,
  validateRequest(MemoryValidation.updateMemoryZodSchema),
  MemoryController.updateMemory,
);

// delete memory
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  MemoryController.deleteMemory,
);

export const MemoryRoutes = router;


