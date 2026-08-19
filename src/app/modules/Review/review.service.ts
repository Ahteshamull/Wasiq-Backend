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

  // check if booking exists
  const booking = await prisma.tripServiceBooking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const isBypassRole =
    userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

  if (!isBypassRole) {
    if (booking.status !== BookingStatus.COMPLETED) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "You can only review services for which you have completed bookings.",
      );
    }
  }

  // check if review already exists for this booking
  const existingReview = await prisma.review.findFirst({
    where: { bookingId },
  });
  if (existingReview) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You have already reviewed this booking");
  }

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      bookingId: booking.id,
      rating,
      comment,
      images,
      status: ReviewStatus.ACTIVE,
    },
    select: {
      id: true,
      userId: true,
      bookingId: true,
      rating: true,
      comment: true,
      images: true,
      status: true,
      createdAt: true,
      updatedAt: true,
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
      bookingId: true,
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
      bookingId: true,
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
