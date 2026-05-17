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

const searchableStoppageIntoDb = async (
  payload: Partial<ISearchableStoppage>,
) => {
  try {
    const { from, to } = payload;

    const fromCity = from?.location?.toLowerCase() || "";
    const toCity = to?.location?.toLowerCase() || "";

    // 1. Try to get coordinates for "from"
    let lat1: number | undefined;
    let lng1: number | undefined;
    if (Array.isArray(from?.coordinates) && from.coordinates.length === 2) {
      if (Math.abs(from.coordinates[0]) > Math.abs(from.coordinates[1])) {
        lat1 = from.coordinates[0];
        lng1 = from.coordinates[1];
      } else {
        lat1 = from.coordinates[1];
        lng1 = from.coordinates[0];
      }
    } else if (fromCity) {
      // First try to match by stoppage name
      const matchedName = popularStoppagesData.find((item: any) => {
        const name = item.name?.toLowerCase() || "";
        const gName = item.googleName?.toLowerCase() || "";
        return name === fromCity || gName === fromCity || name.includes(fromCity) || fromCity.includes(name);
      });
      if (matchedName?.location) {
        lat1 = matchedName.location.lat;
        lng1 = matchedName.location.lng;
      } else {
        // Fallback to city matching
        const matchedFrom = popularStoppagesData.find((item: any) => {
          const city = item.city?.toLowerCase() || "";
          return city.includes(fromCity) || fromCity.includes(city);
        });
        if (matchedFrom?.cityLocation) {
          lat1 = matchedFrom.cityLocation.lat;
          lng1 = matchedFrom.cityLocation.lng;
        }
      }
    }

    // 2. Try to get coordinates for "to"
    let lat2: number | undefined;
    let lng2: number | undefined;
    if (Array.isArray(to?.coordinates) && to.coordinates.length === 2) {
      if (Math.abs(to.coordinates[0]) > Math.abs(to.coordinates[1])) {
        lat2 = to.coordinates[0];
        lng2 = to.coordinates[1];
      } else {
        lat2 = to.coordinates[1];
        lng2 = to.coordinates[0];
      }
    } else if (toCity) {
      // First try to match by stoppage name
      const matchedName = popularStoppagesData.find((item: any) => {
        const name = item.name?.toLowerCase() || "";
        const gName = item.googleName?.toLowerCase() || "";
        return name === toCity || gName === toCity || name.includes(toCity) || toCity.includes(name);
      });
      if (matchedName?.location) {
        lat2 = matchedName.location.lat;
        lng2 = matchedName.location.lng;
      } else {
        // Fallback to city matching
        const matchedTo = popularStoppagesData.find((item: any) => {
          const city = item.city?.toLowerCase() || "";
          return city.includes(toCity) || toCity.includes(city);
        });
        if (matchedTo?.cityLocation) {
          lat2 = matchedTo.cityLocation.lat;
          lng2 = matchedTo.cityLocation.lng;
        }
      }
    }

    let searchableStoppage: any[] = [];

    // 3. If we have both coordinates, do geographical road distance filtering (35km radius limit)!
    if (
      lat1 !== undefined &&
      lng1 !== undefined &&
      lat2 !== undefined &&
      lng2 !== undefined
    ) {
      searchableStoppage = popularStoppagesData
        .map((stoppage: any) => {
          const lat = stoppage.location?.lat;
          const lng = stoppage.location?.lng;
          if (lat === undefined || lng === undefined) return null;

          const dotProduct = (lat - lat1) * (lat2 - lat1) + (lng - lng1) * (lng2 - lng1);
          const squaredDistanceAB = Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2);
          
          let roadDistance: number;
          if (squaredDistanceAB === 0) {
            roadDistance = getDistance(lat, lng, lat1, lng1);
          } else {
            const t = dotProduct / squaredDistanceAB;
            
            // Ensure the stoppage projects onto the road segment connecting the two cities
            if (t < 0 || t > 1) return null;

            const nearestLat = lat1 + t * (lat2 - lat1);
            const nearestLng = lng1 + t * (lng2 - lng1);
            roadDistance = getDistance(lat, lng, nearestLat, nearestLng);
          }

          if (roadDistance > 35000) return null; // 35km radius limit

          return {
            ...stoppage,
            roadDistance: parseFloat((roadDistance / 1000).toFixed(1)), // in km (e.g. 12.3)
            roaddistance: parseFloat((roadDistance / 1000).toFixed(1)), // in km (e.g. 12.3)
          };
        })
        .filter((item: any) => item !== null) as any[];
    } else {
      // Fallback to original city string matching if coordinates are not available
      const searchableStoppageFrom = fromCity
        ? popularStoppagesData.filter((stoppage: any) => {
            const city = stoppage.city?.toLowerCase() || "";
            return city.includes(fromCity) || fromCity.includes(city);
          })
        : [];

      const searchableStoppageTo = toCity
        ? popularStoppagesData.filter((stoppage: any) => {
            const city = stoppage.city?.toLowerCase() || "";
            return city.includes(toCity) || toCity.includes(city);
          })
        : [];

      const mergedData = [...searchableStoppageFrom, ...searchableStoppageTo];
      searchableStoppage = Array.from(
        new Map(mergedData.map((item: any) => [item.id, item])).values(),
      ).map((item: any) => ({
        ...item,
        roadDistance: 0,
        roaddistance: 0,
      }));
    }

    const isDublinCorkRoute =
      (fromCity === "dublin" && toCity === "cork") ||
      (fromCity === "cork" && toCity === "dublin");

    if (isDublinCorkRoute) {
      const orderedStoppages: any[] = [];
      const dublinCorkOrder = [
        "Blarney Castle",
        "Rock of Cashel",
        "Irish National Stud & Gardens",
        "Kilkenny Castle",
        "Cahir Castle",
        "Kildare Village",
        "Rock of Dunamase",
        "Midleton Distillery Experience",
      ];

      for (const name of dublinCorkOrder) {
        const stoppage = popularStoppagesData.find(
          (item: any) => item.name?.toLowerCase() === name.toLowerCase(),
        );
        if (stoppage) {
          let roadDistance = 0;
          if (lat1 !== undefined && lng1 !== undefined && lat2 !== undefined && lng2 !== undefined) {
            const lat = stoppage.location?.lat;
            const lng = stoppage.location?.lng;
            if (lat !== undefined && lng !== undefined) {
              const dotProduct = (lat - lat1) * (lat2 - lat1) + (lng - lng1) * (lng2 - lng1);
              const squaredDistanceAB = Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2);
              if (squaredDistanceAB !== 0) {
                const t = Math.max(0, Math.min(1, dotProduct / squaredDistanceAB));
                const nearestLat = lat1 + t * (lat2 - lat1);
                const nearestLng = lng1 + t * (lng2 - lng1);
                roadDistance = parseFloat((getDistance(lat, lng, nearestLat, nearestLng) / 1000).toFixed(1));
              }
            }
          }
          orderedStoppages.push({
            ...stoppage,
            roadDistance,
            roaddistance: roadDistance,
          });
        }
      }
      searchableStoppage = orderedStoppages;
    } else {
      // Sort the merged/geospatial data by level (1st priority, then 2, 3, 4...)
      searchableStoppage.sort((a: any, b: any) => {
        const levelA = a.level || Number.MAX_VALUE;
        const levelB = b.level || Number.MAX_VALUE;
        return levelA - levelB;
      });

      // Special priority: Killarney/Cork/Limerick <-> Galway routes must have "Cliffs of Moher" at index 0
      const southCities = ["killarney", "cork", "limerick"];
      const northCities = ["galway"];
      const isSpecialRoute =
        (southCities.includes(fromCity) && northCities.includes(toCity)) ||
        (northCities.includes(fromCity) && southCities.includes(toCity));

      if (isSpecialRoute) {
        const moherIndex = searchableStoppage.findIndex(
          (item: any) => item.name?.toLowerCase() === "cliffs of moher",
        );
        if (moherIndex !== -1) {
          const [moher] = searchableStoppage.splice(moherIndex, 1);
          searchableStoppage.unshift(moher);
        } else {
          const originalMoher = popularStoppagesData.find(
            (item: any) => item.name?.toLowerCase() === "cliffs of moher",
          );
          if (originalMoher) {
            let roadDistance = 35.1; // Default fallback in km
            if (lat1 !== undefined && lng1 !== undefined && lat2 !== undefined && lng2 !== undefined) {
              const lat = originalMoher.location?.lat;
              const lng = originalMoher.location?.lng;
              if (lat !== undefined && lng !== undefined) {
                const dotProduct = (lat - lat1) * (lat2 - lat1) + (lng - lng1) * (lng2 - lng1);
                const squaredDistanceAB = Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2);
                if (squaredDistanceAB !== 0) {
                  const t = Math.max(0, Math.min(1, dotProduct / squaredDistanceAB));
                  const nearestLat = lat1 + t * (lat2 - lat1);
                  const nearestLng = lng1 + t * (lng2 - lng1);
                  roadDistance = parseFloat((getDistance(lat, lng, nearestLat, nearestLng) / 1000).toFixed(1));
                }
              }
            }
            const moherWithDistance = {
              ...originalMoher,
              roadDistance,
              roaddistance: roadDistance,
            };
            searchableStoppage.unshift(moherWithDistance);
          }
        }
      }
    }

    // Take exactly the top 8 items (filling with level 1 first, then level 2, etc.)
    const top8Stoppages = searchableStoppage.slice(0, 8);

    return {
      total: top8Stoppages.length,
      searchableStoppage: top8Stoppages,
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
