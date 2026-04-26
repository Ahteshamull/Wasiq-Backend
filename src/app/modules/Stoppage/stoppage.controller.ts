import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { StoppageService } from "./stoppage.service";
import { IStoppageFilters } from "./stoppage.interface";
import { paginationFields } from "../../../constants/pagination";
import { uploadFile } from "../../../helpars/fileUploader";
import { pick } from "../../../shared/pick";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IStoppage } from "./stoppage.interface";

import ApiError from "../../../errors/ApiErrors";

// create stoppage
const createStoppage = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const stoppageData: IStoppage = req.body;

  // image required
  if (!files?.image || files.image.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Image is required");
  }
  // handle image uploads
  let imageUrls: string[] = [];
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

  // image with stoppageData
  const finalStoppageData = {
    ...stoppageData,
    image: imageUrls.length > 0 ? imageUrls : [],
  };

  const result = await StoppageService.createStoppage(finalStoppageData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stoppage created successfully",
    data: result,
  });
});

// get all stoppages
const getAllStoppages = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "type",
    "minPrice",
    "maxPrice",
  ]) as IStoppageFilters;
  const paginationOptions = pick(req.query, paginationFields) as IPaginationOptions;

  const result = await StoppageService.getAllStoppages(
    filters,
    paginationOptions,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stoppages retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// get single stoppage
const getSingleStoppage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StoppageService.getSingleStoppage(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stoppage retrieved successfully",
    data: result,
  });
});

// update stoppage
const updateStoppage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const stoppageData: Partial<IStoppage> = req.body;

  // handle image uploads if provided
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);

    stoppageData.image = imageUrls;
  }

  const result = await StoppageService.updateStoppage(id, stoppageData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stoppage updated successfully",
    data: result,
  });
});

// delete stoppage
const deleteStoppage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StoppageService.deleteStoppage(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stoppage deleted successfully",
    data: result,
  });
});

// get stoppages by from location
const getStoppagesByFromLocation = catchAsync(
  async (req: Request, res: Response) => {
    const { location } = req.params;
    const options = pick(req.query, paginationFields) as IPaginationOptions;

    const result = await StoppageService.getStoppagesByFromLocation(
      location,
      options,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Stoppages retrieved successfully by location",
      meta: result.meta,
      data: result.data,
    });
  },
);

export const StoppageController = {
  createStoppage,
  getAllStoppages,
  getSingleStoppage,
  updateStoppage,
  deleteStoppage,
  getStoppagesByFromLocation,
};


