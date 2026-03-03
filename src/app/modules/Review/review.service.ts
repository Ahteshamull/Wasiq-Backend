import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

// create trip service review
const createTripServiceReview = async (
  userId: string,
  tripServiceId: string,
  rating: number,
  comment?: string,
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

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      tripServiceId: service?.id,
      rating,
      comment,
    },
    select: {
      id: true,
      userId: true,
      tripServiceId: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const ratings = await prisma.review.findMany({
    where: {
      tripServiceId: service?.id,
    },
    select: {
      rating: true,
    },
  });

  // average rating calculation
  const averageRating =
    ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.tripService.update({
    where: { id: service?.id },
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
      tripServiceId: true,
      rating: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};

export const ReviewService = {
  createTripServiceReview,
  getAllReviews,
};
