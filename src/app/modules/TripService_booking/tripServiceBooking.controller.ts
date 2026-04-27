import catchAsync from "../../../shared/catchAsync";
import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { TripServiceBookingService } from "./tripServiceBooking.service";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

// create trip service booking
const createTripServiceBooking = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const tripServiceId = req.params.tripServiceId;

    // validate ObjectID format (24-char hex string)
    if (!/^[0-9a-fA-F]{24}$/.test(tripServiceId)) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Invalid trip service ID format",
        data: null,
      });
    }

    const result = await TripServiceBookingService.createTripServiceBooking(
      userId,
      tripServiceId,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Trip service booking created successfully",
      data: result,
    });
  },
);

// create booking without tripServiceId in URL (tripServiceId optional from body)
const createBookingWithoutParam = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const tripServiceId = req.body.tripServiceId || undefined;

    const result = await TripServiceBookingService.createTripServiceBooking(
      userId,
      tripServiceId,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Trip service booking created successfully",
      data: result,
    });
  },
);

// get my trip service booking
const getMyTripServiceBookings = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const options = pick(req.query, paginationFields);

    const result = await TripServiceBookingService.getMyTripServiceBookings(
      userId,
      options,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My trip service bookings retrieved successfully",
      data: result,
    });
  },
);

// get all trip service booking by admin
const getAllTripServiceBookings = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);

    const result =
      await TripServiceBookingService.getAllTripServiceBookings(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All trip service bookings retrieved successfully",
      data: result,
    });
  },
);

// get single booking who BookingStatus confirmed
const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TripServiceBookingService.getSingleBooking(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Get single booking successfully",
    data: result,
  });
});

// delete trip service booking
const deleteTripServiceBooking = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await (TripServiceBookingService as any).deleteTripServiceBooking(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Trip service booking deleted successfully",
      data: result,
    });
  },
);

// update trip service booking
const updateTripServiceBooking = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await (
      TripServiceBookingService as any
    ).updateTripServiceBooking(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Trip service booking updated successfully",
      data: result,
    });
  },
);

export const TripServiceBookingController = {
  createTripServiceBooking,
  createBookingWithoutParam,
  getMyTripServiceBookings,
  getAllTripServiceBookings,
  getSingleBooking,
  updateTripServiceBooking,
  deleteTripServiceBooking,
};
