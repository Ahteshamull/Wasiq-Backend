import prisma from "../../../shared/prisma";
import { ReviewStatus, BookingStatus, UserRole } from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// create trip service review
const createTripServiceReview = async (
  userId: string,
  bookingId: string,
  rating: number,
  comment?: string,
  images?: string[],
  userRole?: string,
) => {
  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // check if booking exists, belongs to user/agent, and is COMPLETED
  const booking = await prisma.tripServiceBooking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
    },
  });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const isBypassRole =
    userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

  if (!isBypassRole) {
    const isAuthorized =
      booking.userId === userId ||
      (booking.user && booking.user.createdById === userId);
    if (!isAuthorized) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You are not authorized to review this booking",
      );
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You can only review services for which you have completed bookings.",
      );
    }
  }

  if (!booking.tripServiceId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This booking is not associated with any trip service.",
    );
  }

  const tripServiceId = booking.tripServiceId;

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
    throw new ApiError(httpStatus.NOT_FOUND, "Trip service not found");
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
