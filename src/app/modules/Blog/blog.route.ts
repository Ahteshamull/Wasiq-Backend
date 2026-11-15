import { Router } from "express";
import { BlogController } from "./blog.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { BlogValidation } from "./blog.validation";
import validateRequest from "../../middlewares/validateRequest";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = Router();

// create blog (admin only)
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 10 }]),
  parseBodyData,
  validateRequest(BlogValidation.createBlogValidation),
  BlogController.createBlog,
);

// get all blogs (public)
router.get("/", BlogController.getAllBlogs);

// get single blog (public)
router.get("/:id", BlogController.getSingleBlog);

// update blog (admin only)
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 10 }]),
  parseBodyData,
  validateRequest(BlogValidation.updateBlogValidation),
  BlogController.updateBlog,
);

// delete blog (admin only)
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  BlogController.deleteBlog,
);

export const blogRoutes = router;
