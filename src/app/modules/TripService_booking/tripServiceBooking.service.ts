import prisma from "../../../shared/prisma";
import { NotificationService } from "../Notification/notification.service";
import {
  TripServiceBooking,
  ServiceType,
  BookingStatus,
  ServiceStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { ICreateTripServiceBooking } from "./tripServiceBooking.interface";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";

// create trip service booking
const createTripServiceBooking = async (
  userId: string,
  tripServiceId: string | undefined,
  payload: ICreateTripServiceBooking,
): Promise<TripServiceBooking> => {
  const {
    clientName,
    from,
    fromLat,
    fromLng,
    to,
    toLat,
    toLng,
    serviceType,
    distanceKm,
    travelDate,
    timeSlot,
    passengers,
    luggage,
    basePrice,
    vehiclePrice,
    stoppagePrice,
    totalPrice,
    returnPrice,
    isReturn,
    returnDate,
    bookingVehicles = [],
    bookingStoppages = [],
  } = payload;

  // find user
  const findUser = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // trip service exists (only validate if tripServiceId is provided)
  let tripService: any = null;
  if (tripServiceId) {
    tripService = await prisma.tripService.findUnique({
      where: { id: tripServiceId },
    });

    if (!tripService) {
      throw new ApiError(httpStatus.NOT_FOUND, "Trip service not found");
    }

    if (tripService.status !== ServiceStatus.ACTIVE) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Trip service is not available");
    }
  }

  // vehicles exist and are active
  let vehicles: any[] = [];
  if (bookingVehicles.length > 0) {
    const vehicleIds = bookingVehicles.map((v) => v.vehicleId);
    vehicles = await prisma.vehicle.findMany({
      where: {
        id: { in: vehicleIds },
        isActive: true,
      },
    });

    if (vehicles.length !== vehicleIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Some vehicles are not available",
      );
    }
  }

  // stoppages exist
  let stoppages: any[] = [];
  if (bookingStoppages.length > 0) {
    const stoppageIds = bookingStoppages.map((s) => s.stoppageId);
    stoppages = await prisma.stoppage.findMany({
      where: { id: { in: stoppageIds } },
    });

    if (stoppages.length !== stoppageIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Some stoppages are not available",
      );
    }
  }

  // check passenger capacity
  const totalSeat = bookingVehicles.reduce((sum, bv) => {
    const vehicle = vehicles.find((v) => v.id === bv.vehicleId);
    return sum + (vehicle?.seatCount || 0) * bv.quantity;
  }, 0);

  if (passengers > totalSeat) {
    throw new ApiError(400, "Passenger exceeds vehicle capacity");
  }

  // create booking with transaction
  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.tripServiceBooking.create({
      data: {
        clientName,
        from,
        fromLat,
        fromLng,
        to,
        toLat,
        toLng,
        serviceType: serviceType,
        timeSlot,
        travelDate,
        passengers,
        luggage,
        distanceKm,
        basePrice,
        vehiclePrice,
        stoppagePrice,
        returnPrice,
        totalPrice,
        isReturn,
        returnDate,
        user_role: findUser.role as any,
        status: BookingStatus.PENDING,
        userId,
        tripServiceId: tripServiceId || undefined,
      } as any,
    });

    // create booking vehicles
    if (bookingVehicles.length > 0) {
      const bookingVehicleData = bookingVehicles.map((bv) => {
        const vehicle = vehicles.find((v) => v.id === bv.vehicleId);
        if (!vehicle) return null;

        let price = vehicle.basePrice;
        if (vehicle.pricePerKm && distanceKm) {
          price += vehicle.pricePerKm * distanceKm;
        }

        return tx.bookingVehicle.create({
          data: {
            bookingId: booking.id,
            vehicleId: bv.vehicleId,
            quantity: bv.quantity,
            price,
          },
        });
      });

      await Promise.all(bookingVehicleData.filter(Boolean));
    }

    // create booking stoppages
    if (bookingStoppages.length > 0) {
      const bookingStoppageData = bookingStoppages.map((bs) => {
        const stoppage = stoppages.find((s) => s.id === bs.stoppageId);
        if (!stoppage) return null;

        return tx.bookingStoppage.create({
          data: {
            bookingId: booking.id,
            stoppageId: bs.stoppageId,
            quantity: bs.quantity,
            price: stoppage.price,
          },
        });
      });

      await Promise.all(bookingStoppageData.filter(Boolean));
    }

    return booking;
  });

  // Send notification to the user (Client)
  const bookingTitle = tripService?.title || `${from} to ${to}`;
  await NotificationService.createNotification({
    receiverId: userId,
    title: "Booking Created",
    body: `Your booking for ${bookingTitle} has been created successfully.`,
    bookingId: result.id,
  });

  // Send notification to the Agent (Service Owner) — only if tripService exists
  if (tripService) {
    await NotificationService.createNotification({
      receiverId: tripService.userId,
      title: "New Booking Received",
      body: `You have received a new booking for ${tripService.title} from ${findUser.fullName}.`,
      bookingId: result.id,
    });
  }

  return result;
};

// get my trip service booking
const getMyTripServiceBookings = async (
  userId: string,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceBookingWhereInput[] = [];

  filters.push({
    userId,
  });

  const where: Prisma.TripServiceBookingWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripServiceBooking.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { id: "desc" },
  });

  const total = await prisma.tripServiceBooking.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get all trip service booking by admin
const getAllTripServiceBookings = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceBookingWhereInput[] = [];

  filters.push({
    status: BookingStatus.CONFIRMED,
  });

  const where: Prisma.TripServiceBookingWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripServiceBooking.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { id: "desc" },
  });

  const total = await prisma.tripServiceBooking.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: result,
  };
};

// get single booking who BookingStatus confirmed
const getSingleBooking = async (id: string) => {
  // find single booking
  const findBooking = await prisma.tripServiceBooking.findFirst({
    where: {
      id,
      status: BookingStatus.CONFIRMED,
    },
  });

  if (!findBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  return findBooking;
};

// delete trip service booking
const deleteTripServiceBooking = async (id: string) => {
  const findBooking = await prisma.tripServiceBooking.findUnique({
    where: { id },
  });

  if (!findBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const result = await prisma.$transaction(async (tx) => {
    // delete related booking vehicles
    await tx.bookingVehicle.deleteMany({
      where: { bookingId: id },
    });

    // delete related booking stoppages
    await tx.bookingStoppage.deleteMany({
      where: { bookingId: id },
    });

    // delete the booking
    const deletedBooking = await tx.tripServiceBooking.delete({
      where: { id },
    });

    return deletedBooking;
  });

  return result;
};

// update trip service booking
const updateTripServiceBooking = async (
  id: string,
  payload: Partial<TripServiceBooking>,
): Promise<TripServiceBooking> => {
  const findBooking = await prisma.tripServiceBooking.findUnique({
    where: { id },
  });

  if (!findBooking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  const result = await prisma.tripServiceBooking.update({
    where: { id },
    data: payload,
  });

  return result;
};

export const TripServiceBookingService = {
  createTripServiceBooking,
  getMyTripServiceBookings,
  getAllTripServiceBookings,
  getSingleBooking,
  updateTripServiceBooking,
  deleteTripServiceBooking,
};
