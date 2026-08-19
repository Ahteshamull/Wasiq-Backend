import { UserStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import emailSender from "../../../helpars/emailSender";

// create app about
const createOrUpdateAbout = async (description: string) => {
  // check if already exists
  const existing = await prisma.about_App.findFirst();

  if (existing) {
    // update
    return prisma.about_App.update({
      where: { id: existing.id },
      data: { description },
    });
  } else {
    // create
    return prisma.about_App.create({
      data: { description },
    });
  }
};

const getAbout = async () => {
  const result = await prisma.about_App.findFirst();

  if (!result) {
    throw new Error("About App not found");
  }

  return result;
};

// updateNotificationSettings
const updateNotificationSettings = async (
  userId: string,
  payload: {
    supportNotification?: boolean;
    paymentNotification?: boolean;
    emailNotification?: boolean;
  },
) => {
  // find admin
  const findAdmin = await prisma.user.findUnique({
    where: { id: userId, status: UserStatus.ACTIVE },
  });
  if (!findAdmin) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return prisma.user.update({
    where: { id: findAdmin.id },
    data: {
      supportNotification: payload.supportNotification,
      paymentNotification: payload.paymentNotification,
      emailNotification: payload.emailNotification,
    },
    select: {
      id: true,
      supportNotification: true,
      paymentNotification: true,
      emailNotification: true,
    },
  });
};

export const SettingService = {
  createOrUpdateAbout,
  getAbout,
  updateNotificationSettings,
};
