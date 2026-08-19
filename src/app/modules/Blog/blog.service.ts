import { Prisma, Blog } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IBlog, IBlogFilters } from "./blog.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IGenericResponse } from "../../../interfaces/common";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { memoryCache } from "../../../shared/utils/cache";

// create blog
const createBlog = async (payload: IBlog): Promise<Blog> => {
  const result = await prisma.blog.create({
    data: payload,
  });

  memoryCache.clearPattern("blogs:");
  return result;
};

// get all blogs
const getAllBlogs = async (
  filters: IBlogFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<Blog[]>> => {
  const cacheKey = `blogs:${JSON.stringify(filters)}:${JSON.stringify(options)}`;
  const cached = memoryCache.get<IGenericResponse<Blog[]>>(cacheKey);
  if (cached) return cached;

  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const { search, category, minDate, maxDate } = filters;

  const andConditions: Prisma.BlogWhereInput[] = [];

  // search by title, content, category
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
          content: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  // filter by category
  if (category) {
    andConditions.push({
      category: {
        contains: category,
        mode: "insensitive",
      },
    });
  }

  // filter by date range
  if (minDate || maxDate) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (minDate) dateFilter.gte = new Date(minDate);
    if (maxDate) dateFilter.lte = new Date(maxDate);
    andConditions.push({ createdAt: dateFilter });
  }

  const whereCondition: Prisma.BlogWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.blog.findMany({
    where: whereCondition,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.blog.count({
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

// get single blog
const getSingleBlog = async (id: string): Promise<Blog | null> => {
  const result = await prisma.blog.findUnique({
    where: {
      id,
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  return result;
};

// update blog
const updateBlog = async (
  id: string,
  payload: Partial<IBlog>,
): Promise<Blog> => {
  // check if blog exists
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!existingBlog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  const result = await prisma.blog.update({
    where: {
      id,
    },
    data: payload,
  });

  memoryCache.clearPattern("blogs:");
  return result;
};

// delete blog
const deleteBlog = async (id: string): Promise<Blog> => {
  // check if blog exists
  const existingBlog = await prisma.blog.findUnique({
    where: { id },
  });

  if (!existingBlog) {
    throw new ApiError(httpStatus.NOT_FOUND, "Blog not found");
  }

  const result = await prisma.blog.delete({
    where: {
      id,
    },
  });

  memoryCache.clearPattern("blogs:");
  return result;
};

export const BlogService = {
  createBlog,
  getAllBlogs,
  getSingleBlog,
  updateBlog,
  deleteBlog,
};
