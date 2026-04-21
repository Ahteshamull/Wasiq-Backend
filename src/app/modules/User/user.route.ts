import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { userValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import optionalAuth from "../../middlewares/optionalAuth";
import { uploadFile } from "../../../helpars/fileUploader";
import { UserController } from "./user.controller";
import { UserRole } from "@prisma/client";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = express.Router();

// get all users
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllUsers,
);

// get all agents
router.get(
  "/agents",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllAgents,
);

// get all active agents
router.get(
  "/all-admins",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllAdmins,
);

// get all inactive agents
router.get(
  "/inactive-agents",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllInactiveAgents,
);

//get my profile
router.get(
  "/my-profile",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT, UserRole.USER),
  UserController.getMyProfile,
);

router.get(
  "/dashboard",
  auth(UserRole.USER),
  UserController.getDashboardStats,
);

router.get(
  "/get-client-by-agent",
  auth(UserRole.AGENT),
  UserController.getClientByAgent,
);

router.get(
  "/get-single-client/:id",
  optionalAuth,
  UserController.getSingleClient,
);

router.patch(
  "/update-client/:id",
  optionalAuth,
  UserController.updateClient,
);

// get user by id
router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.USER, UserRole.AGENT),
  UserController.getUserById,
);

// create user
router.post(
  "/",
  validateRequest(userValidation.createUserZodSchema),
  UserController.createUser,
);

// create agent
router.post(
  "/agent",
  validateRequest(userValidation.createUserZodSchema),
  UserController.createAgent,
);

router.post(
  "/create-client",
  optionalAuth,
  validateRequest(userValidation.createUserZodSchema),
  UserController.createClient,
);

// create role for supper admin
router.post(
  "/add-role",
  auth(UserRole.SUPER_ADMIN),
  validateRequest(userValidation.createUserZodSchema),
  UserController.createAdminBySupperAdmin,
);

// verify user
router.post("/verify-user", UserController.verifyOtpAndCreateUser);

// single update user (info + profile image)
router.patch(
  "/update",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT, UserRole.USER),
  uploadFile.profileImage,
  parseBodyData,
  validateRequest(userValidation.updateUserZodSchema),
  UserController.updateUser,
);

// update  user status access admin (active to inactive)
router.patch(
  "/update-user-status-inactive/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.updateUserStatusActiveToInActive,
);

// update  user status access admin (inactive to active)
router.patch(
  "/update-user-status-active/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.updateUserStatusInActiveToActive,
);

// delete my account
router.patch(
  "/my-account",
  auth(UserRole.USER, UserRole.AGENT),
  UserController.deleteMyAccount,
);

// delete user
router.delete(
  "/delete-user/:id",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  UserController.deleteUser,
);

export const userRoute = router;
