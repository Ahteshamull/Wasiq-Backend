import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import {
  Prisma,
  User,
  UserRole,
  UserStatus,
  BookingStatus,
} from "@prisma/client";
import { ObjectId } from "mongodb";
import { IPaginationOptions } from "../../../interfaces/paginations";
import {
  IFilterRequest,
  IUpdateUser,
  SafeUser,
  IAdminResponse,
} from "./user.interface";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { searchableFields } from "./user.constant";
import { IGenericResponse } from "../../../interfaces/common";
import { IUploadedFile } from "../../../interfaces/file";
import { uploadFile } from "../../../helpars/fileUploader";
import { getDateRange } from "../../../helpars/filterByDate";
import { createOtpEmailTemplate } from "../../../utils/createOtpEmailTemplate";
import emailSender from "../../../helpars/emailSender";

// create user
const createUser = async (payload: any) => {
  // check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // create user
  const user = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // send welcome email
  const welcomeHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #333;">Welcome to Our Platform!</h2>
      <p>Hi ${user.fullName},</p>
      <p>Thank you for registering with us. Your account has been successfully created.</p>
      <p>You can now log in and start using our services.</p>
      <p>Best regards,<br>Team</p>
    </div>
  `;

  await emailSender("Welcome to Our Platform", user.email, welcomeHtml);

  return user;
};

// create client
const createClient = async (payload: any, agentId?: string | null) => {
  // check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // create user
  const user = await prisma.user.create({
    data: {
      ...payload,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      password: hashedPassword,
      createdById: agentId,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdById: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    } as any,
  });

  // send notification to agent if client was created by an agent
  if (agentId) {
    await prisma.notifications.create({
      data: {
        receiverId: agentId,
        title: "New Client Created",
        body: `You have successfully created a new client: ${user.fullName} (${user.email})`,
      },
    });
  }

  return user;
};

// create agent
const createAgent = async (payload: any) => {
  // check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // create user with inactive status
  const user = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
      role: UserRole.AGENT,
      status: UserStatus.INACTIVE,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // generate OTP
  const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
  // 5 minutes
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  // prepare email html
  const html = createOtpEmailTemplate(randomOtp);

  // send email
  await emailSender("OTP Verification", user.email, html);

  // update user with OTP + expiry
  await prisma.user.update({
    where: { id: user.id },
    data: { otp: randomOtp, otpExpiry },
  });

  return {
    message: "OTP sent to your email",
    email: user.email,
  };
};

// create role for supper admin
const createAdminBySupperAdmin = async (payload: any) => {
  // check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email, status: UserStatus.ACTIVE },
  });
  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User already exists");
  }

  // hash password
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.user.create({
    data: {
      ...payload,
      password: hashedPassword,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
};

// verify otp and create user
const verifyOtpAndCreateUser = async (email: string, otp: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // OTP expired check
  if (!user.otpExpiry || user.otpExpiry < new Date()) {
    // delete user if expired
    await prisma.user.delete({ where: { id: user.id } });
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "OTP has expired, please register again",
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      status: UserStatus.INACTIVE,
      isEmailVerified: true,
      otp: null,
      otpExpiry: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      isEmailVerified: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// get all users
const getAllUsers = async (
  params: IFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<SafeUser[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, timeRange, ...filterData } = params;

  const filters: Prisma.UserWhereInput[] = [];

  // Filter for active users and role USER only
  filters.push({
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  });

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // timeRange filter
  if (timeRange) {
    const dateRange = getDateRange(timeRange);
    if (dateRange) {
      filters.push({
        createdAt: dateRange,
      });
    }
  }

  const where: Prisma.UserWhereInput = { AND: filters };

  const result = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({ where });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get all agents
const getAllAgents = async (
  params: IFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<SafeUser[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, timeRange, ...filterData } = params;

  const filters: Prisma.UserWhereInput[] = [];

  // Filter for active users and role AGENT only
  filters.push({
    role: UserRole.AGENT,
    status: UserStatus.ACTIVE,
  });

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // timeRange filter
  if (timeRange) {
    const dateRange = getDateRange(timeRange);
    if (dateRange) {
      filters.push({
        createdAt: dateRange,
      });
    }
  }

  const where: Prisma.UserWhereInput = { AND: filters };

  const result = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({ where });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get all inactive agents
const getAllInactiveAgents = async (
  params: IFilterRequest,
  options: IPaginationOptions,
): Promise<IGenericResponse<SafeUser[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, timeRange, ...filterData } = params;

  const filters: Prisma.UserWhereInput[] = [];

  // Filter for INACTIVE AGENT and role AGENT only
  filters.push({
    role: UserRole.AGENT,
    status: UserStatus.INACTIVE,
  });

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  // timeRange filter
  if (timeRange) {
    const dateRange = getDateRange(timeRange);
    if (dateRange) {
      filters.push({
        createdAt: dateRange,
      });
    }
  }

  const where: Prisma.UserWhereInput = { AND: filters };

  const result = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({ where });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get all admins
const getAllAdmins = async (
  params: IFilterRequest,
  options: IPaginationOptions,
  loggedInUserId?: string,
): Promise<IAdminResponse> => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.UserWhereInput[] = [];

  // Filter for active users and role ADMIN only
  filters.push({
    role: {
      in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
  });

  if (loggedInUserId) {
    filters.push({
      id: {
        not: loggedInUserId,
      },
    });
  }

  // text search
  if (params?.searchTerm) {
    filters.push({
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // Exact search filter
  if (Object.keys(filterData).length > 0) {
    filters.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const where: Prisma.UserWhereInput = { AND: filters };

  const result = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({ where });

  // get active admin
  const activeAdmin = await prisma.user.count({
    where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
  });

  // get active super admin
  const activeSuperAdmin = await prisma.user.count({
    where: { role: UserRole.SUPER_ADMIN },
  });

  return {
    activeAdmin,
    activeSuperAdmin,
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get user by id
const getUserById = async (id: string): Promise<SafeUser> => {
  if (!ObjectId.isValid(id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid User ID format");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      isStripeConnected: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

// update user (info + profile image)
const updateUser = async (
  id: string,
  updates: IUpdateUser,
  file?: IUploadedFile,
): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id, status: UserStatus.ACTIVE },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // profile image upload if provided
  let profileImageUrl = user.profileImage;
  if (file) {
    const cloudinaryResponse = await uploadFile.uploadToCloudinary(file);
    profileImageUrl = cloudinaryResponse?.secure_url!;
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...updates,
      profileImage: profileImageUrl,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      isStripeConnected: true,
      stripeAccountId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// update  user status access admin (active to inactive)
const updateUserStatusActiveToInActive = async (id: string) => {
  // find user
  const user = await prisma.user.findUnique({
    where: { id, status: UserStatus.ACTIVE },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      status: UserStatus.INACTIVE,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return result;
};

// update  user status access admin (inactive to active)
const updateUserStatusInActiveToActive = async (id: string) => {
  // find user
  const user = await prisma.user.findUnique({
    where: { id, status: UserStatus.INACTIVE },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "Admin not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      fcmToken: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // send activation email
  const activationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #28a745;">Account Activated!</h2>
      <p>Hi ${result.fullName},</p>
      <p>Good news! Your account has been activated by our admin team.</p>
      <p>You can now log in and start our services.</p>
      <p>If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>Admin Team</p>
    </div>
  `;

  await emailSender("Account Activated", result.email, activationHtml);

  return result;
};

// get my profile
const getMyProfile = async (id: string) => {
  const user = await prisma.user.findFirst({
    where: { id, status: UserStatus.ACTIVE },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      isStripeConnected: true,
      stripeAccountId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

// delete my account
const deleteMyAccount = async (userId: string) => {
  const result = await prisma.user.findUnique({
    where: { id: userId, status: UserStatus.ACTIVE },
  });

  if (!result) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: UserStatus.INACTIVE },
  });
};

// delete user
const deleteUser = async (
  userId: string,
  loggedId: string,
): Promise<User | void> => {
  if (!ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format");
  }

  if (userId === loggedId) {
    throw new ApiError(403, "You can't delete your own account!");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tripServices: true,
      triServiceBookings: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const tripServiceIds = existingUser.tripServices.map((ts) => ts.id);
  const bookingIds = existingUser.triServiceBookings.map((b) => b.id);

  await prisma.$transaction(
    async (tx) => {
      // 1. Delete all dependencies of user's bookings
      if (bookingIds.length > 0) {
        await tx.bookingStoppage.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.bookingVehicle.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.payment.deleteMany({
          where: { tripServiceBookingId: { in: bookingIds } },
        });
        await tx.notifications.deleteMany({
          where: { bookingId: { in: bookingIds } },
        });
        await tx.tripServiceBooking.deleteMany({
          where: { id: { in: bookingIds } },
        });
      }

      // 2. Delete all dependencies of user's TripServices (if they are an agent)
      if (tripServiceIds.length > 0) {
        // Find all bookings for these trip services
        const relatedBookings = await tx.tripServiceBooking.findMany({
          where: { tripServiceId: { in: tripServiceIds } },
          select: { id: true },
        });
        const relatedBookingIds = relatedBookings.map((b) => b.id);

        if (relatedBookingIds.length > 0) {
          await tx.bookingStoppage.deleteMany({
            where: { bookingId: { in: relatedBookingIds } },
          });
          await tx.bookingVehicle.deleteMany({
            where: { bookingId: { in: relatedBookingIds } },
          });
          await tx.payment.deleteMany({
            where: { tripServiceBookingId: { in: relatedBookingIds } },
          });
          await tx.notifications.deleteMany({
            where: { bookingId: { in: relatedBookingIds } },
          });
          await tx.tripServiceBooking.deleteMany({
            where: { id: { in: relatedBookingIds } },
          });
        }

        await tx.tripServiceStoppage.deleteMany({
          where: { tripServiceId: { in: tripServiceIds } },
        });
        await tx.tripServiceVehicle.deleteMany({
          where: { tripServiceId: { in: tripServiceIds } },
        });
        await tx.review.deleteMany({
          where: { tripServiceId: { in: tripServiceIds } },
        });
        await tx.tripService.deleteMany({
          where: { id: { in: tripServiceIds } },
        });
      }

      // 3. Delete direct user activities
      await tx.payment.deleteMany({ where: { userId } });
      await tx.notifications.deleteMany({
        where: { OR: [{ receiverId: userId }, { partnerId: userId }] },
      });
      await tx.review.deleteMany({ where: { userId } });
      await tx.favorite.deleteMany({ where: { userId } });

      // Handle messages and channels
      const channels = await tx.channel.findMany({
        where: { OR: [{ person1Id: userId }, { person2Id: userId }] },
        select: { channelName: true, id: true },
      });

      // Also delete any isolated messages sent by user
      await tx.message.deleteMany({ where: { senderId: userId } });

      if (channels.length > 0) {
        const channelNames = channels.map((c) => c.channelName);
        await tx.message.deleteMany({
          where: { channelName: { in: channelNames } },
        });
        await tx.channel.deleteMany({
          where: { id: { in: channels.map((c) => c.id) } },
        });
      }

      await tx.support.deleteMany({
        where: { OR: [{ userId }, { reportedUserId: userId }] },
      });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    },
    {
      maxWait: 5000,
      timeout: 10000,
    },
  );
};

const getClientByAgent = async (
  agentId: string,
  options: IPaginationOptions,
): Promise<IGenericResponse<SafeUser[]>> => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const where: any = {
    createdById: agentId,
    role: UserRole.USER,
  };

  const result = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    } as any,
  });

  const total = await prisma.user.count({ where });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result as any,
  };
};

const getSingleClient = async (id: string): Promise<SafeUser | null> => {
  const result = await prisma.user.findUnique({
    where: {
      id,
      role: UserRole.USER,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdById: true,
      createdBy: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    } as any,
  });
  return result as any;
};

const updateClient = async (id: string, payload: any) => {
  // Check if user exists and is a client
  const existingUser = await prisma.user.findUnique({
    where: { id, role: UserRole.USER },
  });

  if (!existingUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Client not found");
  }

  const result = await prisma.user.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      contactNumber: true,
      address: true,
      country: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    } as any,
  });
  return result;
};

const getDashboardStats = async (userId: string) => {
  const activeBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: BookingStatus.CONFIRMED,
    },
  });

  const completedTrips = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: BookingStatus.COMPLETED,
    },
  });

  const pendingBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: BookingStatus.PENDING,
    },
  });

  const recentBookings = await prisma.tripServiceBooking.findMany({
    where: {
      userId,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      tripService: {
        select: {
          title: true,
          images: true,
          from: true,
          to: true,
        },
      },
    },
  });

  return {
    stats: {
      activeBookings,
      completedTrips,
      pendingBookings,
    },
    recentBookings,
  };
};

export const UserService = {
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
