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
import popularStoppagesData from "./popularStoppagesWithCoords.json";

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

const getRoutePoints = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
): Promise<{ lat: number; lng: number }[]> => {
  try {
    const url = "https://maps.googleapis.com/maps/api/directions/json";
    const response = await axios.get(url, {
      params: {
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const route = response.data.routes?.[0];
    if (!route) return [];

    const points: { lat: number; lng: number }[] = [];
    route.legs?.[0]?.steps?.forEach((step: any) => {
      points.push({
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      });
    });

    return points;
  } catch (error) {
    console.error("Directions API error:", error);
    return [];
  }
};

const getDistanceToSegment = (
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number => {
  const R = 6371e3; // Earth radius in meters
  const latP = (p.lat * Math.PI) / 180;
  const lngP = (p.lng * Math.PI) / 180;
  const latA = (a.lat * Math.PI) / 180;
  const lngA = (a.lng * Math.PI) / 180;
  const latB = (b.lat * Math.PI) / 180;
  const lngB = (b.lng * Math.PI) / 180;

  const xA = lngA * Math.cos((latA + latP) / 2);
  const yA = latA;
  const xB = lngB * Math.cos((latB + latP) / 2);
  const yB = latB;
  const xP = lngP * Math.cos((latP + latP) / 2);
  const yP = latP;

  const dx = xB - xA;
  const dy = yB - yA;
  const squaredLength = dx * dx + dy * dy;

  if (squaredLength === 0) {
    return getDistance(p.lat, p.lng, a.lat, a.lng);
  }

  let t = ((xP - xA) * dx + (yP - yA) * dy) / squaredLength;
  t = Math.max(0, Math.min(1, t));

  const nearestLat = a.lat + t * (b.lat - a.lat);
  const nearestLng = a.lng + t * (b.lng - a.lng);

  return getDistance(p.lat, p.lng, nearestLat, nearestLng);
};

const searchableStoppageIntoDb = async (payload: ISearchableStoppage) => {
  try {
    const { from, to } = payload;
    const startCoords = from.coordinates;
    const endCoords = to.coordinates;

    const origin = { lat: startCoords[0], lng: startCoords[1] };
    const destination = { lat: endCoords[0], lng: endCoords[1] };

    // Fetch real-time highway route points from Google Maps API
    const routePoints = await getRoutePoints(origin, destination);
    if (routePoints.length === 0) {
      routePoints.push(origin, destination);
    }

    // 1. Distance-based sampling: sample a point exactly every 25km (25,000 meters) along the highway
    const sampledPoints: { lat: number; lng: number }[] = [];
    sampledPoints.push(origin); // Always include start origin

    let lastSampledPoint = origin;
    let accumulatedDistance = 0;

    for (let i = 0; i < routePoints.length; i++) {
      const currentPoint = routePoints[i];
      const prevPoint = i === 0 ? origin : routePoints[i - 1];
      accumulatedDistance += getDistance(
        prevPoint.lat,
        prevPoint.lng,
        currentPoint.lat,
        currentPoint.lng,
      );

      if (accumulatedDistance >= 35000) { // 25km distance interval
        sampledPoints.push(currentPoint);
        lastSampledPoint = currentPoint;
        accumulatedDistance = 0;
      }
    }

    // Ensure the destination is also included if it's more than 5km away from the last sampled point
    const distToDest = getDistance(
      lastSampledPoint.lat,
      lastSampledPoint.lng,
      destination.lat,
      destination.lng,
    );
    if (distToDest > 5000) {
      sampledPoints.push(destination);
    }

    // 2. Search nearby tourist attractions and points of interest using Google Places API (15km radius)
    const allFoundPlacesMap = new Map<string, any>();
    const searchTypes = ["tourist_attraction", "point_of_interest"];

    for (const point of sampledPoints) {
      for (const searchType of searchTypes) {
        try {
          const url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
          const params = {
            location: `${point.lat},${point.lng}`,
            radius: "35000", // Focused 35km search radius
            type: searchType,
            key: GOOGLE_MAPS_API_KEY,
          };

          const response = await axios.get(url, { params });
          const places = response.data.results || [];

          places.forEach((place: any) => {
            if (!allFoundPlacesMap.has(place.place_id)) {
              const images = place.photos?.map(
                (photo: any) =>
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
              ) || [];

              allFoundPlacesMap.set(place.place_id, {
                id: place.place_id,
                name: place.name,
                address: place.vicinity || place.formatted_address,
                rating: place.rating ?? 0,
                totalRatings: place.user_ratings_total ?? 0,
                location: {
                  lat: place.geometry?.location?.lat,
                  lng: place.geometry?.location?.lng,
                },
                image: images,
                types: place.types || [],
                roadDistance: 0,
                roaddistance: 0,
              });
            }
          });
        } catch (err) {
          console.error(`Google Places API error for type ${searchType}:`, err);
        }
      }
    }

    const uniquePlaces = Array.from(allFoundPlacesMap.values());

    // Calculate perpendicular road distances to highway segments
    const finalStoppages = uniquePlaces.map((place) => {
      let minDistance = Infinity;

      for (let i = 0; i < routePoints.length - 1; i++) {
        const p1 = routePoints[i];
        const p2 = routePoints[i + 1];
        const dist = getDistanceToSegment(place.location, p1, p2);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }

      if (minDistance === Infinity) {
        minDistance = getDistance(place.location.lat, place.location.lng, origin.lat, origin.lng);
      }

      const roadDistanceKm = parseFloat((minDistance / 1000).toFixed(1));

      return {
        ...place,
        roadDistance: roadDistanceKm,
        roaddistance: roadDistanceKm,
      };
    });

    // 3. Final proximity filter: Only keep stoppages that are within 35km of the actual highway segments
    const filteredStoppages = finalStoppages.filter(
      (item) => item.roadDistance <= 35.0
    );

    // Helper function to normalize names for strict matching
    const normalizeName = (name: string): string => {
      if (!name) return "";
      return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "") // Remove spaces, apostrophes, dashes, and other non-alphanumeric chars
        .trim();
    };

    // 4. Compare and match with popularStoppagesWithCoords.json by name or googleName
    const matchedStoppages: any[] = [];
    const matchedPlaceIds = new Set<string>();

    // A. Scan through all items in popularStoppagesWithCoords.json and check if they lie within 35km perpendicular distance of the highway
    for (const popItem of popularStoppagesData as any[]) {
      if (!popItem.location || !popItem.location.lat || !popItem.location.lng) {
        continue;
      }

      let minDistance = Infinity;
      for (let i = 0; i < routePoints.length - 1; i++) {
        const p1 = routePoints[i];
        const p2 = routePoints[i + 1];
        const dist = getDistanceToSegment(popItem.location, p1, p2);
        if (dist < minDistance) {
          minDistance = dist;
        }
      }

      if (minDistance === Infinity) {
        minDistance = getDistance(popItem.location.lat, popItem.location.lng, origin.lat, origin.lng);
      }

      const roadDistanceKm = parseFloat((minDistance / 1000).toFixed(1));

      // If the popular stoppage is within 35km perpendicular distance of the actual route, include it!
      if (roadDistanceKm <= 35.0) {
        matchedStoppages.push({
          id: popItem.id,
          name: popItem.name,
          googleName: popItem.googleName || popItem.name,
          level: popItem.level ?? 4,
          address: popItem.address || "",
          rating: popItem.rating ?? 0,
          totalRatings: popItem.totalRatings ?? 0,
          location: popItem.location,
          image: popItem.image || [],
          types: popItem.types || [],
          city: popItem.city || "",
          cityLocation: popItem.cityLocation || null,
          roadDistance: roadDistanceKm,
          roaddistance: roadDistanceKm,
        });
        matchedPlaceIds.add(popItem.id);
      }
    }

    // B. For any dynamically found places from Google Nearby Search, match them as backup
    for (const place of filteredStoppages) {
      if (matchedPlaceIds.has(place.id)) {
        continue; // Already added from database scan
      }

      const normPlaceName = normalizeName(place.name);

      const match = (popularStoppagesData as any[]).find((popItem) => {
        const normPopName = normalizeName(popItem.name);
        const normPopGoogleName = normalizeName(popItem.googleName);
        return (
          normPlaceName === normPopName ||
          normPlaceName === normPopGoogleName
        );
      });

      if (match && !matchedStoppages.some(item => item.id === match.id)) {
        matchedStoppages.push({
          id: match.id || place.id,
          name: match.name || place.name,
          googleName: match.googleName || place.googleName || place.name,
          level: match.level ?? 4,
          address: match.address || place.address,
          rating: match.rating ?? place.rating,
          totalRatings: match.totalRatings ?? place.totalRatings,
          location: match.location || place.location,
          image: match.image && match.image.length > 0 ? match.image : place.image,
          types: match.types || place.types,
          city: match.city || "",
          cityLocation: match.cityLocation || null,
          roadDistance: place.roadDistance,
          roaddistance: place.roaddistance,
        });
      }
    }

    // Sort by level ascending (level 1 has highest priority), then by rating descending
    matchedStoppages.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      return b.rating - a.rating;
    });

    // Take only the top 8 popular places prioritized by level
    const topStoppages = matchedStoppages.slice(0, 8);

    return {
      total: topStoppages.length,
      searchableStoppage: topStoppages,
    };
  } catch (error: any) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Failed to search famous locations",
    );
  }
};




// // ✅ Get top 10 popular places along route

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
