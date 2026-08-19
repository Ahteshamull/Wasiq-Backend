import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { ReviewService } from "./review.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { ReviewStatus } from "@prisma/client";
import { uploadFile } from "../../../helpars/fileUploader";

// create trip service review
const createTripServiceReview = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { bookingId, rating, comment } = req.body;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

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

    const result = await ReviewService.createTripServiceReview(
      userId,
      bookingId,
      Number(rating),
      comment,
      imageUrls,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review created successfully",
      data: result,
    });
  },
);

// get all reviews
const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getAllReviews();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All reviews retrieved successfully",
    data: result,
  });
});

const updateReviewStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // boolean true/false

  const reviewStatus = status ? ReviewStatus.ACTIVE : ReviewStatus.INACTIVE;

  const result = await ReviewService.updateReviewStatus(id, reviewStatus);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Review status updated successfully",
    data: result,
  });
});

export const ReviewController = {
  createTripServiceReview,
  getAllReviews,
  updateReviewStatus,
};
