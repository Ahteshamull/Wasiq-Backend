import httpStatus from "http-status";
import {
  ISearchableStoppage,
  IStoppage,
  IStoppageFilters,
} from "./stoppage.interface";
import ApiError from "../../../errors/ApiErrors";
import { paginationHelpers } from "../../../helpars/paginationHelper";
import prisma from "../../../shared/prisma";
import { Prisma, Stoppage } from "@prisma/client";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { IGenericResponse } from "../../../interfaces/common";
import axios from "axios";

// create stoppage
const createStoppage = async (data: IStoppage): Promise<Stoppage> => {
  try {
    const isExist = await (prisma.stoppage as any).findUnique({
      where: {
        name: data.name,
      },
    });

    if (isExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Stoppage with this name already exists",
      );
    }

    const stoppage = await (prisma.stoppage as any).create({
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        duration: data.duration,
        description: data.description,
        image: data.image || [],
        latitude: data.latitude,
        longitude: data.longitude,
        from: data.from,
        to: data.to,
      },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        description: true,
        image: true,
        latitude: true,
        longitude: true,
        from: true,
        to: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return stoppage;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create stoppage",
    );
  }
};

// get all stoppages
const getAllStoppages = async (
  filters: IStoppageFilters,
  options: IPaginationOptions,
): Promise<IGenericResponse<Stoppage[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatedPagination(options);
  const { searchTerm, type, minPrice, maxPrice } = filters;

  const andConditions: Prisma.StoppageWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" as const } },
        { type: { contains: searchTerm, mode: "insensitive" as const } },
        { description: { contains: searchTerm, mode: "insensitive" as const } },
      ],
    });
  }

  if (type) {
    andConditions.push({
      type: { contains: type, mode: "insensitive" as const },
    });
  }

  if (minPrice !== undefined) {
    andConditions.push({ price: { gte: minPrice } });
  }

  if (maxPrice !== undefined) {
    andConditions.push({ price: { lte: maxPrice } });
  }

  const whereConditions: Prisma.StoppageWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await (prisma.stoppage as any).findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder as Prisma.SortOrder }
      : { createdAt: "desc" as Prisma.SortOrder },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      duration: true,
      description: true,
      image: true,
      latitude: true,
      longitude: true,
      from: true,
      to: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.stoppage.count({
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

// get single stoppage
const getSingleStoppage = async (id: string): Promise<Stoppage> => {
  const result = await (prisma.stoppage as any).findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      duration: true,
      description: true,
      image: true,
      latitude: true,
      longitude: true,
      from: true,
      to: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // if stoppage not found
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
  }

  return result;
};

// update stoppage
const updateStoppage = async (
  id: string,
  data: Partial<IStoppage>,
): Promise<Stoppage> => {
  try {
    const isExist = await (prisma.stoppage as any).findUnique({
      where: { id },
    });

    // if stoppage not found
    if (!isExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
    }

    if (data.name) {
      const isNameExist = await (prisma.stoppage as any).findUnique({
        where: { name: data.name },
      });

      if (isNameExist && isNameExist.id !== id) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Stoppage with this name already exists",
        );
      }
    }

    const result = await (prisma.stoppage as any).update({
      where: { id },
      data: {
        name: data.name,
        type: data.type,
        price: data.price,
        duration: data.duration,
        description: data.description,
        image: data.image,
        latitude: data.latitude,
        longitude: data.longitude,
        from: data.from,
        to: data.to,
      },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        description: true,
        image: true,
        latitude: true,
        longitude: true,
        from: true,
        to: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update stoppage",
    );
  }
};

// delete stoppage
const deleteStoppage = async (id: string): Promise<Stoppage> => {
  try {
    const isExist = await (prisma.stoppage as any).findUnique({
      where: { id },
    });

    if (!isExist) {
      throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
    }

    const result = await (prisma.stoppage as any).delete({
      where: { id },
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        duration: true,
        description: true,
        image: true,
        latitude: true,
        longitude: true,
        from: true,
        to: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new ApiError(httpStatus.BAD_REQUEST, error.message);
    }
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to delete stoppage",
    );
  }
};

// get stoppages by from location
const getStoppagesByFromLocation = async (
  location: string,
  options: IPaginationOptions,
): Promise<IGenericResponse<Stoppage[]>> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatedPagination(options);

  const result = await (prisma.stoppage as any).findMany({
    where: {
      from: { equals: location, mode: "insensitive" },
    },
    skip,
    take: limit,
    orderBy: sortBy
      ? { [sortBy]: sortOrder as Prisma.SortOrder }
      : { createdAt: "desc" as Prisma.SortOrder },
    select: {
      id: true,
      name: true,
      type: true,
      price: true,
      duration: true,
      description: true,
      image: true,
      latitude: true,
      longitude: true,
      from: true,
      to: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await (prisma.stoppage as any).count({
    where: {
      from: { equals: location, mode: "insensitive" },
    },
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
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAP_KEY;

// distance function (same)
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ✅ Fetch famous places
const getFamousPlaces = async (
  latitude: number,
  longitude: number,
  radius: number = 20000,
) => {
  const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

  const params = {
    location: `${latitude},${longitude}`,
    radius: String(radius),
    type: "tourist_attraction", // 🔥 important
    key: GOOGLE_MAPS_API_KEY,
  };

  const response = await axios.get(url, { params });

  const places = response.data.results || [];

  return places.map((place: any) => {
    const photoRef = place.photos?.[0]?.photo_reference;

    const image = photoRef
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
      : null;

    return {
      id: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating ?? 0,
      totalRatings: place.user_ratings_total ?? 0,
      location: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      },
      image,
      types: place.types,
    };
  });
};

const searchableStoppageIntoDb = async (
  payload: Partial<ISearchableStoppage>,
) => {
  try {
    const { from, to } = payload;

    if (!from || !to) {
      throw new Error("From and To locations are required");
    }

    const [fromLat, fromLng] = from.coordinates;
    const [toLat, toLng] = to.coordinates;

    // ✅ Get famous places from both points
    const [fromPlaces, toPlaces] = await Promise.all([
      getFamousPlaces(fromLat, fromLng),
      getFamousPlaces(toLat, toLng),
    ]);

    // ✅ Merge + remove duplicates
    const map = new Map();
    [...fromPlaces, ...toPlaces].forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });

    const uniquePlaces = Array.from(map.values());

    // ✅ Filter along route
    const totalDistance = getDistance(fromLat, fromLng, toLat, toLng);

    const filtered = uniquePlaces.filter((p) => {
      const lat = p.location.lat;
      const lng = p.location.lng;

      if (!lat || !lng) return false;

      const d1 = getDistance(fromLat, fromLng, lat, lng);
      const d2 = getDistance(lat, lng, toLat, toLng);

      return d1 + d2 <= totalDistance * 1.2;
    });

    filtered.sort(
      (a, b) => b.rating * b.totalRatings - a.rating * a.totalRatings,
    );

    return {
      success: true,
      route: {
        from: from.location,
        to: to.location,
      },
      total: filtered.length,
      data: filtered,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to search famous locations",
    );
  }
};

// ✅ Get top 10 popular places along route
const popularStoppageIntoDb = async (
  payload: Partial<ISearchableStoppage>,
) => {
  try {
    const { from, to } = payload;

    if (!from || !to) {
      throw new Error("From and To locations are required");
    }

    const [fromLat, fromLng] = from.coordinates;
    const [toLat, toLng] = to.coordinates;

    // ✅ Get famous places from both points
    const [fromPlaces, toPlaces] = await Promise.all([
      getFamousPlaces(fromLat, fromLng),
      getFamousPlaces(toLat, toLng),
    ]);

    // ✅ Merge + remove duplicates
    const map = new Map();
    [...fromPlaces, ...toPlaces].forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });

    const uniquePlaces = Array.from(map.values());

    // ✅ Filter along route
    const totalDistance = getDistance(fromLat, fromLng, toLat, toLng);

    const filtered = uniquePlaces.filter((p) => {
      const lat = p.location.lat;
      const lng = p.location.lng;

      if (!lat || !lng) return false;

      const d1 = getDistance(fromLat, fromLng, lat, lng);
      const d2 = getDistance(lat, lng, toLat, toLng);

      return d1 + d2 <= totalDistance * 1.2;
    });

    // ✅ Sort by popularity and take top 10
    filtered.sort(
      (a, b) => b.rating * b.totalRatings - a.rating * a.totalRatings,
    );

    const top10 = filtered.slice(0, 10);

    return {
      success: true,
      route: {
        from: from.location,
        to: to.location,
      },
      total: top10.length,
      data: top10,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to search popular locations",
    );
  }
};

export const StoppageService = {
  createStoppage,
  getAllStoppages,
  getSingleStoppage,
  updateStoppage,
  deleteStoppage,
  getStoppagesByFromLocation,
  searchableStoppageIntoDb,
  popularStoppageIntoDb,
};
