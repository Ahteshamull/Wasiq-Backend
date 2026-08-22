import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";
import { Prisma, SupportStatus, UserStatus } from "@prisma/client";
import { IFilterRequest } from "./support.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { searchableFields } from "./support.constant";
import emailSender from "../../../helpars/emailSender";
import config from "../../../config";

// create user-to-user report
const createUserReport = async (
  reporterId: string,
  reportedUserId: string,
  data: any,
) => {
  const { subject, description } = data;
  if (!subject || !description) {
    throw new ApiError(httpStatus.BAD_REQUEST, "fields are required");
  }

  // find reporter user
  const reporter = await prisma.user.findUnique({ where: { id: reporterId } });
  if (!reporter) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reporter not found");
  }

  // find reported user
  const reportedUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
  });
  if (!reportedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reported user not found");
  }

  // create support with special data
  const support = await prisma.support.create({
    data: {
      userId: reporterId, // reporter creates the support
      subject: `Report against ${reportedUser.fullName}`,
      description,
      fullName: reporter?.fullName,
      email: reporter?.email,
      contactNumber: reporter?.contactNumber,
      reportedUserId: reportedUser?.id,
    },
  });

  // create notification for admins
  await prisma.notifications.create({
    data: {
      title: "User Report Created",
      body: `${reporter.fullName} has reported ${reportedUser.fullName}`,
      message: `Report Subject: ${subject}`,
      serviceTypes: "SUPPORT",
    },
  });

  return support;
};

// create user support by mail
const createUserSupportByMail = async (data: any) => {
  const { fullName, email, contactNumber, subject, description } = data;
  if (!fullName || !email || !contactNumber || !subject || !description) {
    throw new ApiError(httpStatus.BAD_REQUEST, "fields are required");
  }

  // create notification for admins
  await prisma.notifications.create({
    data: {
      title: "User Support Created",
      body: `${fullName} has created a support request`,
      message: `Support Subject: ${subject}`,
      serviceTypes: "SUPPORT",
    },
  });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Support Request</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
    <tr>
      <td align="center">

        <table width="600" cellpadding="0" cellspacing="0" 
          style="background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#2563eb; padding:20px; text-align:center;">
              <h2 style="color:#ffffff; margin:0;">New Support Request</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:30px; color:#333;">

              <p style="margin-bottom:20px;">
                A new support request has been submitted from the platform.
              </p>

              <table width="100%" cellpadding="8" cellspacing="0" 
                style="border-collapse: collapse;">

                <tr>
                  <td style="font-weight:bold; border-bottom:1px solid #eee;">Full Name</td>
                  <td style="border-bottom:1px solid #eee;">${fullName}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold; border-bottom:1px solid #eee;">Email</td>
                  <td style="border-bottom:1px solid #eee;">${email}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold; border-bottom:1px solid #eee;">Contact Number</td>
                  <td style="border-bottom:1px solid #eee;">${contactNumber}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold; border-bottom:1px solid #eee;">Subject</td>
                  <td style="border-bottom:1px solid #eee;">${subject}</td>
                </tr>

                <tr>
                  <td style="font-weight:bold; vertical-align:top;">Description</td>
                  <td>${description}</td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px; text-align:center; font-size:13px; color:#777;">
              This is an automated message from <strong>Tourenzo Platform Support System</strong>.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;

  await emailSender(
    `New Support Request: ${subject}`,
    config.emailSender.email as string,
    emailHtml,
  );
};

// get all support
const getAllSupport = async (
  params: IFilterRequest,
  options: IPaginationOptions,
) => {
  const { limit, page, skip } = paginationHelpers.calculatedPagination(options);

  const { searchTerm, ...filterData } = params;

  const filters: Prisma.SupportWhereInput[] = [];

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

  // always get only Pending status
  filters.push({
    status: SupportStatus.Pending,
  });

  const where: Prisma.SupportWhereInput = {
    AND: filters,
  };

  const result = await prisma.support.findMany({
    where,
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const finalData = await Promise.all(
    result.map(async (item) => {
      let reportedUser = null;

      if (item.reportedUserId) {
        reportedUser = await prisma.user.findUnique({
          where: { id: item.reportedUserId },
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        });
      }

      return {
        ...item,
        reportedUser,
      };
    }),
  );

  const total = await prisma.support.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: finalData,
  };
};

// get my support
const getMySupport = async (userId: string) => {
  // find user
  const findUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.support.findMany({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  const finalData = await Promise.all(
    result.map(async (item) => {
      let reportedUser = null;

      if (item.reportedUserId) {
        reportedUser = await prisma.user.findUnique({
          where: { id: item.reportedUserId },
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        });
      }

      return {
        ...item,
        reportedUser,
      };
    }),
  );

  return finalData;
};

// get support by id
const getSupportById = async (id: string) => {
  const result = await prisma.support.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Support not found");
  }

  // find reported user
  let reportedUser = null;

  if (result.reportedUserId) {
    reportedUser = await prisma.user.findUnique({
      where: { id: result.reportedUserId },
      select: {
        id: true,
        fullName: true,
        email: true,
        profileImage: true,
      },
    });
  }

  return {
    ...result,
    reportedUser,
  };
};

// update my support
const updateMySupport = async (
  userId: string,
  supportId: string,
  data: any,
) => {
  // find user
  const findUser = await prisma.user.findUnique({
    where: { id: userId, status: UserStatus.ACTIVE },
  });
  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // find support
  const findSupport = await prisma.support.findUnique({
    where: { id: supportId, userId },
  });
  if (!findSupport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Support not found");
  }

  const result = await prisma.support.update({
    where: { id: supportId },
    data,
  });
  return result;
};

// delete my support
const deleteMySupport = async (userId: string, supportId: string) => {
  // find user
  const findUser = await prisma.user.findUnique({
    where: { id: userId, status: UserStatus.ACTIVE },
  });
  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // find support
  const findSupport = await prisma.support.findUnique({
    where: { id: supportId, userId },
  });
  if (!findSupport) {
    throw new ApiError(httpStatus.NOT_FOUND, "Support not found");
  }

  const result = await prisma.support.delete({
    where: { id: findSupport.id },
  });
  return result;
};

// delete support
const deleteSupport = async (supportId: string) => {
  const result = await prisma.support.delete({
    where: { id: supportId },
  });
  return result;
};

export const SupportService = {
  createUserReport,
  createUserSupportByMail,
  getAllSupport,
  getMySupport,
  getSupportById,
  updateMySupport,
  deleteMySupport,
  deleteSupport,
};
