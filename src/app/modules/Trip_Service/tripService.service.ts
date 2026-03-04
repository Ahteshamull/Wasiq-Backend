import { Prisma, ServiceType, TripService, Vehicle } from "@prisma/client";
import prisma from "../../../shared/prisma";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { ITripService, ITripServiceFilters } from "./tripService.interface";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IGenericResponse } from "../../../interfaces/common";

// create trip service
const createTripService = async (
  userId: string,
  payload: ITripService,
): Promise<TripService> => {
  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.tripService.create({
    data: {
      ...payload,
      userId: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// get all trip services
const getAllTripServices = async (
  filters: ITripServiceFilters,
  options: IPaginationOptions,
): Promise<{ data: TripService[]; meta: any }> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);
  const { search, from, to, minPrice, maxPrice, routeType, isPopular } =
    filters;

  const andConditions: Prisma.TripServiceWhereInput[] = [];

  // search condition
  if (search) {
    andConditions.push({
      OR: [
        { from: { contains: search, mode: "insensitive" } },
        { to: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  // from filter
  if (from) {
    andConditions.push({ from: { contains: from, mode: "insensitive" } });
  }

  // to filter
  if (to) {
    andConditions.push({ to: { contains: to, mode: "insensitive" } });
  }

  // price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceFilter: any = {};
    if (minPrice !== undefined) priceFilter.gte = minPrice;
    if (maxPrice !== undefined) priceFilter.lte = maxPrice;
    andConditions.push({ price: priceFilter });
  }

  // route type filter
  if (routeType) {
    andConditions.push({ routeType: routeType });
  }

  // popular filter
  if (isPopular !== undefined) {
    andConditions.push({ isPopular: isPopular });
  }

  const whereConditions: Prisma.TripServiceWhereInput = {
    AND: andConditions,
  };

  const result = await prisma.tripService.findMany({
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
  });

  const total = await prisma.tripService.count({
    where: whereConditions,
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

// ----------------- by the hour -----------------

// get all trip services BY_THE_HOUR
const getByTheHourTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({ serviceType: ServiceType.BY_THE_HOUR });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get all trip services BY_THE_HOUR and isPopular
const getByTheHourPopularTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.BY_THE_HOUR,
    isPopular: true,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// ----------------- day trip -----------------

// create day trip service
const createDayTripService = async (
  userId: string,
  payload: ITripService,
): Promise<TripService> => {
  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.tripService.create({
    data: {
      ...payload,
      userId: user.id,
      serviceType: ServiceType.DAY_TRIP,
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// get all trip services DAY_TRIP
const getDayTripTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({ serviceType: ServiceType.DAY_TRIP });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get all trip services DAY_TRIP and isPopular
const getDayTripPopularTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.DAY_TRIP,
    isPopular: true,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get trip service DAY_TRIP on the from location group
const getDayTripTripServicesByFromLocationGroup = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.DAY_TRIP,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const trips = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // group by "from" location
  const groupedData = trips.reduce((acc: any[], trip) => {
    const existingGroup = acc.find((item) => item.from === trip.from);

    if (existingGroup) {
      existingGroup.trips.push(trip);
    } else {
      acc.push({
        from: trip.from,
        trips: [trip],
      });
    }

    return acc;
  }, []);

  const total = await prisma.tripService.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: groupedData,
  };
};

// ----------------- multi day tour -----------------

// create MULTI_DAY_TOUR trip service
const createMultiDayTourTripService = async (
  userId: string,
  payload: ITripService,
): Promise<any> => {
  // check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.tripService.create({
    data: {
      ...payload,
      userId: user.id,
      serviceType: ServiceType.MULTI_DAY_TOUR,
    },
    select: {
      id: true,
      serviceType: true,
      groupType: true,
      images: true,
      description: true,
      routeType: true,
      tourDays: true,
      isPopular: true,
      features: true,
      isService: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// get all trip services MULTI_DAY_TOUR
const getMultiDayTourTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({ serviceType: ServiceType.MULTI_DAY_TOUR });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get all trip services MULTI_DAY_TOUR and isPopular
const getMultiDayTourPopularTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.MULTI_DAY_TOUR,
    isPopular: true,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get trip service MULTI_DAY_TOUR on the tourDays group
const getMultiDayTourTripServicesByTourDaysGroup = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.MULTI_DAY_TOUR,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const trips = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    select: {
      id: true,
      serviceType: true,
      groupType: true,
      images: true,
      description: true,
      routeType: true,
      tourDays: true,
      isPopular: true,
      features: true,
      isService: true,
      status: true,
      ratings: true,
      reviewCount: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // group by tourDays
  const groupedData = trips.reduce((acc: any[], trip) => {
    const existingGroup = acc.find((item) => item.tourDays === trip.tourDays);

    if (existingGroup) {
      existingGroup.trips.push(trip);
    } else {
      acc.push({
        tourDays: trip.tourDays,
        trips: [trip],
      });
    }

    return acc;
  }, []);

  const total = await prisma.tripService.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: groupedData,
  };
};

// ----------------- private transfer -----------------

// get all trip services PRIVATE_TRANSFER
const getPrivateTransferTripServices = async (
  options: IPaginationOptions,
  passengers?: number,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  // filter only PRIVATE_TRANSFER services
  filters.push({ serviceType: ServiceType.PRIVATE_TRANSFER });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  // all active vehicles
  const allActiveVehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { seatCount: "asc" },
  });

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // helper best vehicles to passengers
  const getSuggestedVehicles = (
    vehicles: Vehicle[],
    passengers: number,
  ): Vehicle[] => {
    const sorted = [...vehicles].sort((a, b) => a.seatCount - b.seatCount);

    // try single best vehicle
    const single = sorted.find((v) => v.seatCount >= passengers);
    if (single) return [single];

    // ---- combination logic ----
    let bestCombination: Vehicle[] | null = null;

    const dfs = (startIndex: number, remaining: number, combo: Vehicle[]) => {
      if (remaining <= 0) {
        // minimal vehicle count priority
        if (!bestCombination || combo.length < bestCombination.length) {
          bestCombination = [...combo];
        }
        return;
      }

      for (let i = startIndex; i < sorted.length; i++) {
        const vehicle = sorted[i];

        // pruning (skip worse solution)
        if (bestCombination && combo.length + 1 >= bestCombination.length)
          continue;

        combo.push(vehicle);

        dfs(i, remaining - vehicle.seatCount, combo);

        combo.pop();
      }
    };

    dfs(0, passengers, []);

    if (!bestCombination) {
      throw new Error("No vehicle combination found");
    }

    return bestCombination;
  };

  // manually add filtered vehicles with trip service
  const resultWithVehicles = result.map((tripService) => {
    let suggestedVehicles: Vehicle[] = [];

    if (passengers) {
      try {
        suggestedVehicles = getSuggestedVehicles(allActiveVehicles, passengers);
      } catch {
        suggestedVehicles = [];
      }
    }

    return {
      ...tripService,
      vehicles: passengers ? suggestedVehicles : allActiveVehicles,
    };
  });

  const total = await prisma.tripService.count({ where });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: resultWithVehicles,
  };
};

// get all trip services PRIVATE_TRANSFER and isPopular
const getPrivateTransferPopularTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.PRIVATE_TRANSFER,
    isPopular: true,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
    where,
  });

  return {
    meta: {
      total,
      page: 1,
      limit: total,
    },
    data: result,
  };
};

// get trip service PRIVATE_TRANSFER on the from location group
const getPrivateTransferTripServicesByFromLocationGroup = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.PRIVATE_TRANSFER,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const trips = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // group by "from" location
  const groupedData = trips.reduce((acc: any[], trip) => {
    const existingGroup = acc.find((item) => item.from === trip.from);

    if (existingGroup) {
      existingGroup.trips.push(trip);
    } else {
      acc.push({
        from: trip.from,
        trips: [trip],
      });
    }

    return acc;
  }, []);

  const total = await prisma.tripService.count({
    where,
  });

  return {
    meta: {
      total,
      page,
      limit,
    },
    data: groupedData,
  };
};

// ----------------- airport transfer -----------------

// get all trip services AIRPORT_TRANSFER
const getAirportTransferTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({ serviceType: ServiceType.AIRPORT_TRANSFER });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get all trip services AIRPORT_TRANSFER and isPopular
const getAirportTransferPopularTripServices = async (
  options: IPaginationOptions,
): Promise<IGenericResponse<TripService[]>> => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  const filters: Prisma.TripServiceWhereInput[] = [];

  filters.push({
    serviceType: ServiceType.AIRPORT_TRANSFER,
    isPopular: true,
    status: "ACTIVE",
  });

  const where: Prisma.TripServiceWhereInput = {
    AND: filters,
  };

  const result = await prisma.tripService.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { bookingCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await prisma.tripService.count({
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

// get single trip service
const getSingleTripService = async (id: string): Promise<TripService> => {
  const result = await prisma.tripService.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Trip service not found");
  }

  return result;
};

// update trip service
const updateTripService = async (
  id: string,
  payload: Partial<ITripService>,
): Promise<TripService> => {
  // check if trip service exists and belongs to user
  const existingTripService = await prisma.tripService.findFirst({
    where: { id },
  });

  if (!existingTripService) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Trip service not found or you don't have permission",
    );
  }

  const result = await prisma.tripService.update({
    where: { id },
    data: payload,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return result;
};

// delete trip service
const deleteTripService = async (id: string): Promise<TripService> => {
  // check if trip service exists and belongs to user
  const existingTripService = await prisma.tripService.findFirst({
    where: { id },
  });

  if (!existingTripService) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "Trip service not found or you don't have permission",
    );
  }

  const result = await prisma.tripService.delete({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  return result;
};

export const TripServiceService = {
  createTripService,
  getAllTripServices,

  // by the hour
  getByTheHourTripServices,
  getByTheHourPopularTripServices,

  // the day trip
  createDayTripService,
  getDayTripTripServices,
  getDayTripPopularTripServices,
  getDayTripTripServicesByFromLocationGroup,

  // tour
  createMultiDayTourTripService,
  getMultiDayTourTripServices,
  getMultiDayTourPopularTripServices,
  getMultiDayTourTripServicesByTourDaysGroup,

  // transfer
  getPrivateTransferTripServices,
  getPrivateTransferPopularTripServices,
  getPrivateTransferTripServicesByFromLocationGroup,

  // airport transfer
  getAirportTransferTripServices,
  getAirportTransferPopularTripServices,

  getSingleTripService,
  updateTripService,
  deleteTripService,
};
