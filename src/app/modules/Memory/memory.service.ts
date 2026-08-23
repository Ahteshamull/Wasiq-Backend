import { Prisma, Memory } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IMemory, IMemoryFilters } from "./memory.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { memoryCache } from "../../../shared/utils/cache";

// create memory
const createMemory = async (payload: IMemory): Promise<Memory> => {
  const result = await prisma.memory.create({
    data: payload,
  });

  memoryCache.clearPattern("memories:");
  return result;
};

// get all memories
const getAllMemories = async (
  filters: IMemoryFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<Memory[]>> => {
  const cacheKey = `memories:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
  const cached = memoryCache.get<IGenericResponse<Memory[]>>(cacheKey);
  if (cached) return cached;

  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);
  const { search, minDate, maxDate } = filters;

  const andConditions: Prisma.MemoryWhereInput[] = [];

  // search by title, description
  if (search) {
    andConditions.push({
      OR: [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        }
      ],
    });
  }

  // filter by date range
  if (minDate || maxDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (minDate) dateFilter.gte = new Date(minDate);
    if (maxDate) dateFilter.lte = new Date(maxDate);
    andConditions.push({ createdAt: dateFilter });
  }

  const whereCondition: Prisma.MemoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.memory.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.memory.count({
    where: whereCondition,
  });

  const responseData = {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };

  memoryCache.set(cacheKey, responseData, 300000); // 5 mins cache
  return responseData;
};

// get single memory
const getSingleMemory = async (id: string): Promise<Memory | null> => {
  const result = await prisma.memory.findUnique({
    where: {
      id,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
  }

  return result;
};

// update memory
const updateMemory = async (
  id: string,
  payload: Partial<IMemory>,
): Promise<Memory> => {
  // check if memory exists
  const existingMemory = await prisma.memory.findUnique({
    where: { id },
  });

  if (!existingMemory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
  }

  const result = await prisma.memory.update({
    where: {
      id,
    },
    data: payload,
  });

  memoryCache.clearPattern("memories:");
  return result;
};

// delete memory
const deleteMemory = async (id: string): Promise<Memory> => {
  // check if memory exists
  const existingMemory = await prisma.memory.findUnique({
    where: { id },
  });

  if (!existingMemory) {
    throw new ApiError(httpStatus.NOT_FOUND, "Memory not found");
  }

  const result = await prisma.memory.delete({
    where: {
      id,
    },
  });

  memoryCache.clearPattern("memories:");
  return result;
};

export const MemoryService = {
  createMemory,
  getAllMemories,
  getSingleMemory,
  updateMemory,
  deleteMemory,
};
