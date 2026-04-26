import httpStatus from "http-status";
import { IStoppage, IStoppageFilters } from "./stoppage.interface";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import { Prisma, Stoppage } from "@prisma/client";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IGenericResponse } from "../../../interfaces/common";


// create stoppage
const createStoppage = async (data: IStoppage): Promise<Stoppage> => {
  try {
    const isExist = await (prisma.stoppage as any).findUnique({
      where: {
        name: data.name,
      },
    });

    if (isExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Stoppage with this name already exists",
      );
    }

    const stoppage = await (prisma.stoppage as any).create({
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        duration: data.duration,
        description: data.description,
        image: data.image || [],
        latitude: data.latitude,
        longitude: data.longitude,
        from: data.from,
        to: data.to,
      },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        description: true,
        image: true,
        latitude: true,
        longitude: true,
        from: true,
        to: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return stoppage;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create stoppage",
    );
  }
};

// get all stoppages
const getAllStoppages = async (
  filters: IStoppageFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<Stoppage[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatedPagination(options);
  const { searchTerm, type, minPrice, maxPrice } = filters;

  const andConditions: Prisma.StoppageWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" as const } },
        { type: { contains: searchTerm, mode: "insensitive" as const } },
        { description: { contains: searchTerm, mode: "insensitive" as const } },
      ],
    });
  }

  if (type) {
    andConditions.push({
      type: { contains: type, mode: "insensitive" as const },
    });
  }

  if (minPrice !== undefined) {
    andConditions.push({ price: { gte: minPrice } });
  }

  if (maxPrice !== undefined) {
    andConditions.push({ price: { lte: maxPrice } });
  }

  const whereConditions: Prisma.StoppageWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await (prisma.stoppage as any).findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder as Prisma.SortOrder }
      : { createdAt: "desc" as Prisma.SortOrder },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      duration: true,
      description: true,
      image: true,
      latitude: true,
      longitude: true,
      from: true,
      to: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.stoppage.count({
    where: whereConditions,
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

// get single stoppage
const getSingleStoppage = async (id: string): Promise<Stoppage> => {
  const result = await (prisma.stoppage as any).findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      duration: true,
      description: true,
      image: true,
      latitude: true,
      longitude: true,
      from: true,
      to: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // if stoppage not found
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
  }

  return result;
};

// update stoppage
const updateStoppage = async (
  id: string,
  data: Partial<IStoppage>,
): Promise<Stoppage> => {
  try {
    const isExist = await (prisma.stoppage as any).findUnique({
      where: { id },
    });

    // if stoppage not found
    if (!isExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
    }

    if (data.name) {
      const isNameExist = await (prisma.stoppage as any).findUnique({
        where: { name: data.name },
      });

      if (isNameExist && isNameExist.id !== id) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Stoppage with this name already exists",
        );
      }
    }

    const result = await (prisma.stoppage as any).update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        duration: data.duration,
        description: data.description,
        image: data.image,
        latitude: data.latitude,
        longitude: data.longitude,
        from: data.from,
        to: data.to,
      },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        description: true,
        image: true,
        latitude: true,
        longitude: true,
        from: true,
        to: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update stoppage",
    );
  }
};

// delete stoppage
const deleteStoppage = async (id: string): Promise<Stoppage> => {
  try {
    const isExist = await (prisma.stoppage as any).findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
    }

    const result = await (prisma.stoppage as any).delete({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        description: true,
        image: true,
        latitude: true,
        longitude: true,
        from: true,
        to: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to delete stoppage",
    );
  }
};

// get stoppages by from location
const getStoppagesByFromLocation = async (
  location: string,
  options: IPaginationOptions,
): Promise<IGenericResponse<Stoppage[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatedPagination(options);

  const result = await (prisma.stoppage as any).findMany({
    where: {
      from: { equals: location, mode: "insensitive" },
    },
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder as Prisma.SortOrder }
      : { createdAt: "desc" as Prisma.SortOrder },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      duration: true,
      description: true,
      image: true,
      latitude: true,
      longitude: true,
      from: true,
      to: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await (prisma.stoppage as any).count({
    where: {
      from: { equals: location, mode: "insensitive" },
    },
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

export const StoppageService = {
  createStoppage,
  getAllStoppages,
  getSingleStoppage,
  updateStoppage,
  deleteStoppage,
  getStoppagesByFromLocation,
};

