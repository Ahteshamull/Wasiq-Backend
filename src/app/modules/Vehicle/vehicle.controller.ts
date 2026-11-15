import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { VehicleService } from "./vehicle.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";
import { uploadFile } from "../../../helpars/fileUploader";

// create vehicle
const createVehicle = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const vehicleData = req.body;

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

  // check if images are provided
  if (imageUrls.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Images are required",
      data: null,
    });
  }

  // combine vehicle data with image URLs
  const finalVehicleData = {
    ...vehicleData,
    image: imageUrls,
  };

  const result = await VehicleService.createVehicle(finalVehicleData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Vehicle created successfully",
    data: result,
  });
});

// get all vehicles
const getAllVehicles = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "search",
    "minSeatCount",
    "maxSeatCount",
    "minBasePrice",
    "maxBasePrice",
    "isActive",
  ]);
  const options = pick(req.query, paginationFields);

  const result = await VehicleService.getAllVehicles(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicles retrieved successfully",
    data: result,
  });
});

// get single vehicle
const getSingleVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await VehicleService.getSingleVehicle(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle retrieved successfully",
    data: result,
  });
});

// update vehicle
const updateVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const vehicleData = req.body;

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

  // combine vehicle data with image
  const finalVehicleData = {
    ...vehicleData,
    ...(imageUrls.length > 0 && { image: imageUrls }),
  };

  const result = await VehicleService.updateVehicle(id, finalVehicleData);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle updated successfully",
    data: result,
  });
});

// delete vehicle
const deleteVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await VehicleService.deleteVehicle(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vehicle deleted successfully",
    data: result,
  });
});

export const VehicleController = {
  createVehicle,
  getAllVehicles,
  getSingleVehicle,
  updateVehicle,
  deleteVehicle,
};
