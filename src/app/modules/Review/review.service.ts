import prisma from "../../../shared/prisma";
import { ReviewStatus, BookingStatus } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// create trip service review
const createTripServiceReview = async (
  userId: string,
  tripServiceId: string,
  rating: number,
  comment?: string,
  images?: string[],
) => {
  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // check if service exists
  const service = await prisma.tripService.findUnique({
    where: { id: tripServiceId },
    select: {
      id: true,
      ratings: true,
      reviewCount: true,
    },
  });
  if (!service) {
    throw new ApiError(httpStatus.NOT_FOUND, "Room not found");
  }

  // check if user or agent has a completed booking for this service
  const completedBooking = await prisma.tripServiceBooking.findFirst({
    where: {
      tripServiceId,
      status: BookingStatus.COMPLETED,
      OR: [{ userId }, { user: { createdById: userId } }],
    },
  });

  if (!completedBooking) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only review services for which you have completed bookings.",
    );
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      tripServiceId: service.id,
      rating,
      comment,
      images,
    },
    select: {
      id: true,
      userId: true,
      tripServiceId: true,
      rating: true,
      comment: true,
      images: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const ratings = await prisma.review.findMany({
    where: {
      tripServiceId: service.id,
    },
    select: {
      rating: true,
    },
  });

  // average rating calculation
  const averageRating =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.tripService.update({
    where: { id: service.id },
    data: {
      ratings: parseFloat(averageRating.toFixed(1)),
      reviewCount: ratings.length,
    },
  });

  return review;
};

// get all reviews
const getAllReviews = async () => {
  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          contactNumber: true,
        },
      },
      tripServiceId: true,
      rating: true,
      comment: true,
      images: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};

// update review status
const updateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, "Review not found");
  }

  const result = await prisma.review.update({
    where: { id: reviewId },
    data: { status },
    select: {
      id: true,
      userId: true,
      tripServiceId: true,
      rating: true,
      comment: true,
      images: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return result;
};

export const ReviewService = {
  createTripServiceReview,
  getAllReviews,
  updateReviewStatus,
};
