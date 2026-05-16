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
import { getPopularStoppages } from "./popularStoppages";

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
const getSingleStoppage = async (id: string): Promise<any> => {
  // If it's a valid MongoDB ObjectID, check database first
  if (/^[0-9a-fA-F]{24}$/.test(id)) {
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

    if (result) {
      return result;
    }
  }

  // If not found in DB or not an ObjectID, try Google Places
  const googlePlace = await getPlaceDetails(id);
  if (googlePlace) {
    return googlePlace;
  }

  throw new ApiError(httpStatus.NOT_FOUND, "Stoppage not found");
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
  radius: number = 35000,
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
    const images =
      place.photos?.map(
        (photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`,
      ) || [];

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
      image: images,
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

    // ✅ Get famous places along the entire route
    const totalDistance = getDistance(fromLat, fromLng, toLat, toLng);
    const step = 30000; // Sample every 30km
    const pointsCount = Math.max(2, Math.ceil(totalDistance / step) + 1);

    const fetchPromises = [];
    for (let i = 0; i < pointsCount; i++) {
      const ratio = i / (pointsCount - 1);
      const sampleLat = fromLat + ratio * (toLat - fromLat);
      const sampleLng = fromLng + ratio * (toLng - fromLng);
      fetchPromises.push(getFamousPlaces(sampleLat, sampleLng, 35000));
    }

    const placesArrays = await Promise.all(fetchPromises);
    const allPlaces = placesArrays.flat();

    // ✅ Merge + remove duplicates
    const map = new Map();
    allPlaces.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });

    const uniquePlaces = Array.from(map.values());

    // Prepare popular stoppages map for level lookup and normalization
    const normalizeName = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[’'′]/g, "'") // Standardize apostrophes
        .trim();

    const popularStoppagesList = getPopularStoppages();
    const popularStoppagesMap = new Map(
      popularStoppagesList.map((s: any) => [normalizeName(s.name), s.level]),
    );

    // ✅ Filter along route
    const filtered = uniquePlaces.filter((p: any) => {
      const lat = p.location.lat;
      const lng = p.location.lng;

      if (!lat || !lng) return false;

      // ✅ Exclude ferry terminals
      const isFerry = p.types?.some((type: string) =>
        type.toLowerCase().includes("ferry"),
      );
      if (isFerry) return false;

      // ✅ Match with popularStoppages list and get level
      const placeNameNormalized = normalizeName(p.name);
      const level = popularStoppagesMap.get(placeNameNormalized);

      if (level === undefined) return false;

      p.level = level; // Inject level into the place object for sorting

      const d1 = getDistance(fromLat, fromLng, lat, lng);
      const d2 = getDistance(lat, lng, toLat, toLng);

      // ✅ Ensure it's between start and end
      const dotProduct =
        (lat - fromLat) * (toLat - fromLat) +
        (lng - fromLng) * (toLng - fromLng);
      const squaredDistanceAB =
        Math.pow(toLat - fromLat, 2) + Math.pow(toLng - fromLng, 2);

      const t = dotProduct / squaredDistanceAB;
      if (t < 0 || t > 1) return false;

      // ✅ Calculate perpendicular distance to the road (max 35km for popular spots)
      const nearestLat = fromLat + t * (toLat - fromLat);
      const nearestLng = fromLng + t * (toLng - fromLng);
      const roadDistance = getDistance(lat, lng, nearestLat, nearestLng);

      if (roadDistance > 35000) return false;

      return true;
    });

    // ✅ Selection logic: Prioritize Level 1, then fill up to 8 with Levels 2, 3, 4
    filtered.sort((a: any, b: any) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      // If same level, sort by popularity (rating * totalRatings)
      return (b.rating || 0) * (b.totalRatings || 0) - (a.rating || 0) * (a.totalRatings || 0);
    });

    // Limit to max 8 stops
    const top8Stoppages = filtered.slice(0, 8);

    // ✅ Fetch full details for each result to get multiple images
    const filteredWithDetails = await Promise.all(
      top8Stoppages.map(async (place: any) => {
        try {
          const details = await getPlaceDetails(place.id);
          return {
            ...(details || place),
            level: place.level, // preserve level in response
            from: from.location,
            to: to.location,
          };
        } catch (error) {
          return {
            ...place,
            from: from.location,
            to: to.location,
          };
        }
      }),
    );

    return {
      success: true,
      route: {
        from: from.location,
        to: to.location,
      },
      total: filteredWithDetails.length,
      data: filteredWithDetails,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to search famous locations",
    );
  }
};

// // ✅ Get top 10 popular places along route
// const popularStoppageIntoDb = async (payload: Partial<ISearchableStoppage>) => {
//   try {
//     const { from, to } = payload;

//     if (!from || !to) {
//       throw new Error("From and To locations are required");
//     }

//     const [fromLat, fromLng] = from.coordinates;
//     const [toLat, toLng] = to.coordinates;

//     // ✅ Get famous places along the entire route
//     const totalDistance = getDistance(fromLat, fromLng, toLat, toLng);
//     const step = 30000; // Sample every 30km
//     const pointsCount = Math.max(2, Math.ceil(totalDistance / step) + 1);

//     const fetchPromises = [];
//     for (let i = 0; i < pointsCount; i++) {
//       const ratio = i / (pointsCount - 1);
//       const sampleLat = fromLat + ratio * (toLat - fromLat);
//       const sampleLng = fromLng + ratio * (toLng - fromLng);
//       fetchPromises.push(getFamousPlaces(sampleLat, sampleLng, 35000));
//     }

//     const placesArrays = await Promise.all(fetchPromises);
//     const allPlaces = placesArrays.flat();

//     // ✅ Merge + remove duplicates
//     const map = new Map();
//     allPlaces.forEach((p) => {
//       if (!map.has(p.id)) map.set(p.id, p);
//     });

//     const uniquePlaces = Array.from(map.values());

//     // ✅ Filter along route
//     const filtered = uniquePlaces.filter((p) => {
//       const lat = p.location.lat;
//       const lng = p.location.lng;

//       if (!lat || !lng) return false;

//       // ✅ Match with popularStoppages list
//       const popularStoppages = getPopularStoppages().map((s: any) =>
//         s.name.toLowerCase(),
//       );
//       const placeName = p.name.toLowerCase();
//       const isPopular = popularStoppages.includes(placeName);

//       if (!isPopular) return false;

//       const d1 = getDistance(fromLat, fromLng, lat, lng);
//       const d2 = getDistance(lat, lng, toLat, toLng);


//       // ✅ Ensure it's between start and end
//       const dotProduct =
//         (lat - fromLat) * (toLat - fromLat) +
//         (lng - fromLng) * (toLng - fromLng);
//       const squaredDistanceAB =
//         Math.pow(toLat - fromLat, 2) + Math.pow(toLng - fromLng, 2);

//       const t = dotProduct / squaredDistanceAB;
//       if (t < 0 || t > 1) return false;

//       // ✅ Calculate perpendicular distance to the road (max 20km)
//       const nearestLat = fromLat + t * (toLat - fromLat);
//       const nearestLng = fromLng + t * (toLng - fromLng);
//       const roadDistance = getDistance(lat, lng, nearestLat, nearestLng);

//       if (roadDistance > 35000) return false;

//       return true;
//     });

//     // ✅ Sort by popularity and take top 6
//     filtered.sort(
//       (a, b) => b.rating * b.totalRatings - a.rating * a.totalRatings,
//     );

//     const top6 = filtered.slice(0, 6);

//     // ✅ Fetch full details for each top result to get multiple images
//     const top6WithDetails = await Promise.all(
//       top6.map(async (place) => {
//         try {
//           const details = await getPlaceDetails(place.id);
//           return {
//             ...(details || place),
//             from: from.location,
//             to: to.location,
//           };
//         } catch (error) {
//           return {
//             ...place,
//             from: from.location,
//             to: to.location,
//           };
//         }
//       }),
//     );

//     return {
//       success: true,
//       route: {
//         from: from.location,
//         to: to.location,
//       },
//       total: top6WithDetails.length,
//       data: top6WithDetails,
//     };
//   } catch (error: any) {
//     throw new ApiError(
//       httpStatus.INTERNAL_SERVER_ERROR,
//       error.message || "Failed to search popular locations",
//     );
//   }
// };

// ✅ Fetch place details from Google
const getPlaceDetails = async (placeId: string) => {
  try {
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params = {
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
    };

    const response = await axios.get(url, { params });
    const place = response.data.result;

    if (!place) return null;

    const images =
      place.photos?.map(
        (photo: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`,
      ) || [];

    // Try to find a price from our database if this stoppage exists by name
    const existingStoppage = await (prisma.stoppage as any).findUnique({
      where: { name: place.name },
    });

    return {
      id: place.place_id,
      name: place.name,
      type: place.types?.[0] || "Tourist Attraction",

      price: existingStoppage ? existingStoppage.price : 0,
      rating: place.rating ?? 0,
      totalRatings: place.user_ratings_total ?? 0,
      reviews: place.reviews ?? [],
      description:
        place.editorial_summary?.overview ||
        existingStoppage?.description ||
        place.formatted_address ||
        place.vicinity,
      image: images,
      latitude: place.geometry?.location?.lat,
      longitude: place.geometry?.location?.lng,
      from: null,
      to: null,
    };
  } catch (error) {
    return null;
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
  // popularStoppageIntoDb,
};
