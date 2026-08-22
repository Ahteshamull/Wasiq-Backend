import { UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { JwtPayload, Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import emailSender from "../../../helpars/emailSender";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import prisma from "../../../shared/prisma";
import { generateOtpEmailTemplate } from "../../../shared/utils/emailTemplates";
import {
  ILoginRequest,
  ILoginResponse,
  ISignupRequest,
  ISignupResponse,
} from "./auth.interface";

// login user
const loginUser = async (payload: ILoginRequest): Promise<ILoginResponse> => {
  const { email, password, fcmToken, role } = payload;

  const userData = await prisma.user.findFirst({
    where: { email: email, status: UserStatus.ACTIVE, role: role as UserRole },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (userData.status === UserStatus.INACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is inactive");
  }

  if (!password || !userData.password) {
    throw new Error("Password is required");
  }

  const isCorrectPassword = await bcrypt.compare(password, userData.password);

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "incorrect credentials!");
  }

  // update fcm token
  let updatedFcmToken = userData;
  if (fcmToken) {
    try {
      updatedFcmToken = await prisma.user.update({
        where: { id: userData.id },
        data: { fcmToken: fcmToken },
      });
    } catch (error) {
      console.error("Failed to update FCM token:", error);
      // Don't throw error here, login should still work
    }
  }

  // generate token
  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string,
  );

  const result = {
    accessToken,
    refreshToken,
    user: {
      fcmToken: updatedFcmToken.fcmToken,
    },
  };

  return result;
};

// social login (Google / Facebook)
const socialLogin = async (payload: any) => {
  const { email, fcmToken, fullName, role } = payload;

  // if user already exist
  let user = await prisma.user.findFirst({
    where: { email: email, status: UserStatus.ACTIVE },
  });

  // if user not exist then create
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        fullName,
        role,
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 12),
        status: UserStatus.ACTIVE,
      },
    });
  }

  // if user is inactive
  if (user.status === UserStatus.INACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account is inactive");
  }

  // fcm token update
  if (fcmToken) {
    try {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { fcmToken },
      });
    } catch (error) {
      //
    }
  }

  // access Token Generate
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  // refresh Token Generate
  const refreshToken = jwtHelpers.generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      fcmToken: user.fcmToken,
    },
  };
};

// website login before booking
const loginWebsite = async (payload: ISignupRequest) => {
  const { fullName, email, password, contactNumber, country, fcmToken, role } =
    payload;

  // check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "User already exists with this email",
    );
  }

  // use default password if not provided
  const finalPassword = password && password.length >= 6 ? password : "123456";

  // hash password
  const hashedPassword = await bcrypt.hash(finalPassword, 12);

  // create user
  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
      contactNumber: contactNumber || null,
      country: country || null,
      role: (role as UserRole) || UserRole.USER,
      status: UserStatus.ACTIVE,
      fcmToken: fcmToken || "",
    },
  });

  // generate token
  const accessToken = jwtHelpers.generateToken(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string,
  );

  const result: ISignupResponse = {
    accessToken,
    refreshToken,
    user: {
      id: newUser.id,
      fullName: newUser.fullName,
      email: newUser.email,
      profileImage: newUser.profileImage,
      contactNumber: newUser.contactNumber,
      country: newUser.country,
      role: newUser.role,
      fcmToken: newUser.fcmToken,
    },
  };

  return result;
};

// refresh token
const refreshToken = async (token: string) => {
  let decodedData;

  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.refresh_token_secret as string,
    ) as JwtPayload;
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Your not authorized");
  }

  const isUserExist = await prisma.user.findUnique({
    where: {
      email: decodedData?.email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!isUserExist) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const newAccessToken = jwtHelpers.generateToken(
    { id: isUserExist.id, email: isUserExist.email, role: isUserExist.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string,
  );

  return {
    accessToken: newAccessToken,
  };
};

// change password
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
) => {
  const userData = await prisma.user.findUnique({
    where: {
      id: userId,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      password: true,
    },
  });
  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isPasswordMatch: boolean = await bcrypt.compare(
    oldPassword,
    userData.password,
  );
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  return {
    message: "Password changed successfully",
  };
};

// forgot password
const forgotPassword = async (payload: { email: string }) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });
  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // generate 4 digit otp
  const randomOtp = Math.floor(1000 + Math.random() * 9000);
  // expire time 5 min otp
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

  const html = generateOtpEmailTemplate(randomOtp.toString());

  await emailSender("[Wasik Transfers] OTP Verification Code", userData.email, html);

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      otp: randomOtp.toString(),
      otpExpiry: otpExpiry,
    },
  });

  return {
    message: "OTP sent successfully",
  };
};

// verify otp
const verifyOtp = async (otp: string) => {
  const userData = await prisma.user.findFirst({
    where: {
      AND: [
        {
          otp: otp,
        },
      ],
    },
  });

  if (!userData) {
    throw new ApiError(404, "Your otp is incorrect");
  }

  if (userData.otpExpiry && userData.otpExpiry < new Date()) {
    throw new ApiError(400, "Your otp has been expired");
  }

  const resetToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      purpose: "reset_password",
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string,
  );

  await prisma.user.update({
    where: {
      id: userData.id,
    },
    data: {
      otp: null,
      otpExpiry: null,
      identifier: null,
    },
  });

  const result = {
    resetToken,
  };

  return result;
};

// reset password
const resetPassword = async (
  token: string,
  // userId: string,
  payload: { password: string; confirmPassword: string },
) => {
  const { password, confirmPassword } = payload;

  const jwtToken = token?.startsWith("Bearer ") ? token.split(" ")[1] : token;

  // check if passwords match
  if (password !== confirmPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Passwords do not match");
  }

  // verify token
  let decodedToken;
  try {
    decodedToken = jwtHelpers.verifyToken(
      jwtToken,
      config.jwt.reset_pass_secret as Secret,
    );
  } catch (error) {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid or expired token");
  }

  if (decodedToken?.purpose !== "reset_password") {
    throw new ApiError(httpStatus.FORBIDDEN, "Invalid reset token");
  }

  // find user by decoded token id
  const userData = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // hash the new password
  const hashedPassword = await bcrypt.hash(password, 12);

  // update the user's password
  await prisma.user.update({
    where: { id: userData?.id },
    data: {
      password: hashedPassword,
      otp: null,
      otpExpiry: null,
    },
  });

  return { message: "Password reset successfully" };
};

// delete user and all their activities
const deleteUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      tripServices: true,
      triServiceBookings: true,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const tripServiceIds = user.tripServices.map((ts) => ts.id);
  const bookingIds = user.triServiceBookings.map((b) => b.id);

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
          where: {
            booking: {
              tripServiceId: { in: tripServiceIds },
            },
          },
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

  return { message: "User deleted successfully" };
};

export const AuthServices = {
  loginUser,
  socialLogin,
  loginWebsite,
  refreshToken,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
  deleteUser,
};
