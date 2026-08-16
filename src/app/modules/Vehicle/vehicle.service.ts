import { Prisma, Vehicle } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IVehicle, IVehicleFilters } from "./vehicle.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// create vehicle
const createVehicle = async (payload: IVehicle): Promise<Vehicle> => {
  if (payload.plateNumber) {
    const existingVehicleByPlate = await prisma.vehicle.findFirst({
      where: {
        plateNumber: {
          equals: payload.plateNumber,
          mode: "insensitive",
        },
      },
    });

    if (existingVehicleByPlate) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Vehicle with this plate number already exists.",
      );
    }
  }

  const result = await prisma.vehicle.create({
    data: payload as Prisma.VehicleCreateInput,
  });

  return result;
};

// get all vehicles
const getAllVehicles = async (
  filters: IVehicleFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<Vehicle[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const {
    search,
    minSeatCount,
    maxSeatCount,
    isActive,
  } = filters;

  const andConditions: Prisma.VehicleWhereInput[] = [];

  // search by name
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
          plateNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // filter by seat count range
  if (minSeatCount !== undefined || maxSeatCount !== undefined) {
    const seatCountFilter: Prisma.IntFilter = {};
    if (minSeatCount !== undefined) seatCountFilter.gte = minSeatCount;
    if (maxSeatCount !== undefined) seatCountFilter.lte = maxSeatCount;
    andConditions.push({ seatCount: seatCountFilter });
  }

  // filter by active status
  if (isActive !== undefined) {
    andConditions.push({ isActive });
  }

  const whereCondition: Prisma.VehicleWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.vehicle.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { id: "desc" },
  });

  const total = await prisma.vehicle.count({
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

// get single vehicle
const getSingleVehicle = async (id: string): Promise<Vehicle | null> => {
  const result = await prisma.vehicle.findUnique({
    where: {
      id,
    },
  });

  return result;
};

// update vehicle
const updateVehicle = async (
  id: string,
  payload: Partial<IVehicle>,
): Promise<Vehicle> => {
  // check if vehicle exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!existingVehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, "Vehicle not found");
  }

  const result = await prisma.vehicle.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

// delete vehicle
const deleteVehicle = async (id: string): Promise<Vehicle> => {
  // check if vehicle exists
  const existingVehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!existingVehicle) {
    throw new ApiError(httpStatus.NOT_FOUND, "Vehicle not found");
  }

  // Check if the vehicle is associated with any bookings
  const bookingCount = await prisma.bookingVehicle.count({
    where: {
      vehicleId: id,
    },
  });

  if (bookingCount > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Vehicle cannot be deleted because it is associated with existing bookings. You can deactivate it instead.",
    );
  }

  const result = await prisma.vehicle.delete({
    where: {
      id,
    },
  });

  return result;
};

export const VehicleService = {
  createVehicle,
  getAllVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
