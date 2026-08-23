import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { MemoryService } from "./memory.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

// create memory
const createMemory = catchAsync(async (req: Request, res: Response) => {
  const result = await MemoryService.createMemory(req.body);

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
  const result = await MemoryService.updateMemory(id, req.body);

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
