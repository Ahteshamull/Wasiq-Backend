import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserService } from "./user.service";
import { pick } from "../../../shared/pick";
import { filterField } from "./user.constant";
import { paginationFields } from "../../../constants/pagination";
import { IUploadedFile } from "../../../interfaces/file";

// create user
const createUser = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  const result = await UserService.createUser(userData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

// create client by agent
const createClient = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  const agentId = req.user?.id || null;
  const result = await UserService.createClient(userData, agentId);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Client created successfully",
    data: result,
  });
});

// create agent
const createAgent = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  const result = await UserService.createAgent(userData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      "OTP sent to your email. Please verify OTP and wait for admin approval",
    data: result,
  });
});

// create role for supper admin
const createAdminBySupperAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const userData = req.body;
    const result = await UserService.createAdminBySupperAdmin(userData);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Admin created successfully",
      data: result,
    });
  },
);

// verify user
const verifyOtpAndCreateUser = catchAsync(
  async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    const result = await UserService.verifyOtpAndCreateUser(email, otp);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User verified successfully",
      data: result,
    });
  },
);

// get all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, filterField);
  const options = pick(req.query, paginationFields);
  const result = await UserService.getAllUsers(filter, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

// get all agents
const getAllAgents = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, filterField);
  const options = pick(req.query, paginationFields);
  const result = await UserService.getAllAgents(filter, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Agents fetched successfully",
    data: result,
  });
});

// get all inactive agents
const getAllInactiveAgents = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, filterField);
  const options = pick(req.query, paginationFields);
  const result = await UserService.getAllInactiveAgents(filter, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inactive agents fetched successfully",
    data: result,
  });
});

// get all admins
const getAllAdmins = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, filterField);
  const options = pick(req.query, paginationFields);
  const result = await UserService.getAllAdmins(filter, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admins fetched successfully",
    data: result,
  });
});

// get user by id
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await UserService.getUserById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: { ...user, password: undefined },
  });
});

// update user (info + profile image)
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const data = req.body;
  const file = req.file as IUploadedFile | undefined;

  const result = await UserService.updateUser(userId, data, file);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile updated successfully",
    data: result,
  });
});

// update  user status access admin (active to inactive)
const updateUserStatusActiveToInActive = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await UserService.updateUserStatusActiveToInActive(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Admin status updated successfully",
      data: result,
    });
  },
);

// update  user status access admin (inactive to active)
const updateUserStatusInActiveToActive = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const result = await UserService.updateUserStatusInActiveToActive(id);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Admin status updated successfully",
      data: result,
    });
  },
);

// get my profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;

  const result = await UserService.getMyProfile(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My profile retrieved successfully",
    data: result,
  });
});

// delete my account
const deleteMyAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await UserService.deleteMyAccount(userId);

  // clear the token cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My account deleted successfully",
    data: result,
  });
});

// delete user
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const loggedId = req.user.id;

  await UserService.deleteUser(userId, loggedId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deleted successfully",
    data: undefined,
  });
});

const getClientByAgent = catchAsync(async (req: Request, res: Response) => {
  const agentId = req.user.id;
  const options = pick(req.query, paginationFields);
  const result = await UserService.getClientByAgent(agentId, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Clients fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getSingleClient = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getSingleClient(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Client fetched successfully",
    data: result,
  });
});

const updateClient = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const result = await UserService.updateClient(id, data);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Client updated successfully",
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await UserService.getDashboardStats(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Dashboard stats fetched successfully",
    data: result,
  });
});

export const UserController = {
  getDashboardStats,
  createUser,
  createClient,
  createAgent,
  createAdminBySupperAdmin,
  verifyOtpAndCreateUser,
  getAllUsers,
  getAllAgents,
  getAllInactiveAgents,
  getAllAdmins,
  getUserById,
  updateUser,
  updateUserStatusActiveToInActive,
  updateUserStatusInActiveToActive,
  getMyProfile,
  deleteMyAccount,
  deleteUser,
  getClientByAgent,
  getSingleClient,
  updateClient,
};
