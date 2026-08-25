import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { MemoryService } from "./memory.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { uploadFile } from "../../../helpars/fileUploader";
import ApiError from "../../../errors/ApiErrors";

// create memory
const createMemory = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  let imageUrls: string[] = [];

  // upload all images to Cloudinary
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // Also include any URL strings passed in body
  if (req.body?.image) {
    if (Array.isArray(req.body.image)) {
      imageUrls = [...imageUrls, ...req.body.image];
    } else if (typeof req.body.image === "string") {
      imageUrls.push(req.body.image);
    }
  }

  if (imageUrls.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "At least one image is required for creating a memory",
    );
  }

  const memoryData = {
    ...req.body,
    image: imageUrls,
  };

  const result = await MemoryService.createMemory(memoryData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Memory created successfully",
    data: result,
  });
});

// get all memories
const getAllMemories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["search", "minDate", "maxDate"]);
  const options = pick(req.query, paginationFields);

  const result = await MemoryService.getAllMemories(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Memories retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// get single memory
const getSingleMemory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MemoryService.getSingleMemory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Memory retrieved successfully",
    data: result,
  });
});

// update memory
const updateMemory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  let imageUrls: string[] = [];

  // upload new images to Cloudinary
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // Include existing image URLs if provided
  if (req.body?.image) {
    if (Array.isArray(req.body.image)) {
      imageUrls = [...imageUrls, ...req.body.image];
    } else if (typeof req.body.image === "string") {
      imageUrls.push(req.body.image);
    }
  }

  const updateData = {
    ...req.body,
    ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
  };

  const result = await MemoryService.updateMemory(id, updateData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Memory updated successfully",
    data: result,
  });
});

// delete memory
const deleteMemory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MemoryService.deleteMemory(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Memory deleted successfully",
    data: result,
  });
});

export const MemoryController = {
  createMemory,
  getAllMemories,
  getSingleMemory,
  updateMemory,
  deleteMemory,
};


