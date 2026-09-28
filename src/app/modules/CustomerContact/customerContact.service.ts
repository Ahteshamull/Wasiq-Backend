import { Prisma, CustomerContact, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import config from "../../../config";
import {
  ICustomerContact,
  ICustomerContactFilters,
} from "./customerContact.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import emailSender from "../../../helpars/emailSender";
import {
  generateCustomerContactUserEmailTemplate,
  generateCustomerContactAdminEmailTemplate,
} from "../../../shared/utils/emailTemplates";

// create customer contact
const createCustomerContact = async (
  payload: ICustomerContact,
): Promise<CustomerContact> => {
  const name = payload.name || payload.fullName || "";
  const fullName = payload.fullName || payload.name || "";
  const phone = payload.phone || payload.contactNumber || "";
  const contactNumber = payload.contactNumber || payload.phone || "";

  const dataToSave = {
    ...payload,
    name,
    fullName,
    phone,
    contactNumber,
  };

  const result = await prisma.customerContact.create({
    data: dataToSave,
  });

  // 1. send confirmation email to customer
  try {
    const userEmailSubject = "Thank you for contacting Tourenzo - We've received your inquiry";
    const userEmailHtml = generateCustomerContactUserEmailTemplate(dataToSave);
    await emailSender(userEmailSubject, payload.email, userEmailHtml);
  } catch (error) {
    console.error("Failed to send customer confirmation email:", error);
  }

  // 2. send notification email to admin(s)
  try {
    const adminEmailSubject = payload.subject
      ? `New Customer Inquiry: ${payload.subject}`
      : `New Travel Inquiry from ${name || payload.email}`;
    const adminEmailHtml = generateCustomerContactAdminEmailTemplate(dataToSave);

    if (config.contactMailAddress) {
      // Send to the specified contact email address in configuration
      await emailSender(adminEmailSubject, config.contactMailAddress, adminEmailHtml);
    } else {
      // Fallback: Query all users with ADMIN or SUPER_ADMIN role
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
          },
        },
        select: {
          email: true,
        },
      });

      for (const admin of admins) {
        if (admin.email) {
          try {
            await emailSender(adminEmailSubject, admin.email, adminEmailHtml);
          } catch (adminEmailError) {
            console.error(`Failed to send contact notification email to admin: ${admin.email}`, adminEmailError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to send admin notification email:", error);
  }

  return result;
};

// get all customer contacts
const getAllCustomerContacts = async (
  filters: ICustomerContactFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<CustomerContact[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const { search, minDate, maxDate, startDate, endDate } = filters;

  const andConditions: Prisma.CustomerContactWhereInput[] = [];

  // search across name, fullName, email, phone, contactNumber, address, subject
  if (search) {
    andConditions.push({
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          contactNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          address: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          subject: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // filter by travel startDate or endDate if provided
  if (startDate) {
    andConditions.push({
      startDate: {
        contains: startDate,
        mode: "insensitive",
      },
    });
  }

  if (endDate) {
    andConditions.push({
      endDate: {
        contains: endDate,
        mode: "insensitive",
      },
    });
  }

  // filter by creation date range
  if (minDate || maxDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (minDate) dateFilter.gte = new Date(minDate);
    if (maxDate) dateFilter.lte = new Date(maxDate);
    andConditions.push({ createdAt: dateFilter });
  }

  const whereCondition: Prisma.CustomerContactWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.customerContact.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.customerContact.count({
    where: whereCondition,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get single customer contact
const getSingleCustomerContact = async (
  id: string,
): Promise<CustomerContact | null> => {
  const result = await prisma.customerContact.findUnique({
    where: {
      id,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer contact not found");
  }

  return result;
};

// update customer contact
const updateCustomerContact = async (
  id: string,
  payload: Partial<ICustomerContact>,
): Promise<CustomerContact> => {
  // check if customer contact exists
  const existingCustomerContact = await prisma.customerContact.findUnique({
    where: { id },
  });

  if (!existingCustomerContact) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer contact not found");
  }

  const updateData: Partial<ICustomerContact> = { ...payload };
  if (payload.name && !payload.fullName) {
    updateData.fullName = payload.name;
  }
  if (payload.fullName && !payload.name) {
    updateData.name = payload.fullName;
  }
  if (payload.phone && !payload.contactNumber) {
    updateData.contactNumber = payload.phone;
  }
  if (payload.contactNumber && !payload.phone) {
    updateData.phone = payload.contactNumber;
  }

  const result = await prisma.customerContact.update({
    where: {
      id,
    },
    data: updateData,
  });

  return result;
};

// delete customer contact
const deleteCustomerContact = async (id: string): Promise<CustomerContact> => {
  // check if customer contact exists
  const existingCustomerContact = await prisma.customerContact.findUnique({
    where: { id },
  });

  if (!existingCustomerContact) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer contact not found");
  }

  const result = await prisma.customerContact.delete({
    where: {
      id,
    },
  });

  return result;
};

export const CustomerContactService = {
  createCustomerContact,
  getAllCustomerContacts,
  getSingleCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
};
