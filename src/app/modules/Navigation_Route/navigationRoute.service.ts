import { AppTarget, NavigationRoute, Prisma, UserRole } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { memoryCache } from "../../../shared/utils/cache";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { INavigationRoute, INavigationRouteFilter } from "./navigationRoute.interface";

const CACHE_KEY_PREFIX = "nav_routes:";

// Get all navigation routes with caching
const getAllNavigationRoutes = async (
  filter: INavigationRouteFilter,
  userRole?: UserRole
): Promise<NavigationRoute[]> => {
  const cacheKey = `${CACHE_KEY_PREFIX}${filter.targetApp || "ALL"}_${filter.isActive ?? "ALL"}_${userRole || "ALL"}`;
  const cached = memoryCache.get<NavigationRoute[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const where: Prisma.NavigationRouteWhereInput = {};

  if (filter.targetApp) {
    where.targetApp = filter.targetApp;
  }

  if (typeof filter.isActive === "boolean") {
    where.isActive = filter.isActive;
  }

  if (filter.group) {
    where.group = filter.group;
  }

  if (userRole) {
    where.allowedRoles = {
      has: userRole,
    };
  }

  const routes = await prisma.navigationRoute.findMany({
    where,
    orderBy: {
      order: "asc",
    },
  });

  // If no routes found in DB, auto-seed defaults and fetch again
  if (routes.length === 0) {
    await seedDefaultRoutes();
    return prisma.navigationRoute.findMany({
      where,
      orderBy: {
        order: "asc",
      },
    });
  }

  // Cache for 10 minutes
  memoryCache.set(cacheKey, routes, 600000);

  return routes;
};

// Update route config
const updateNavigationRoute = async (
  id: string,
  payload: Partial<INavigationRoute>
): Promise<NavigationRoute> => {
  const existingRoute = await prisma.navigationRoute.findUnique({
    where: { id },
  });

  if (!existingRoute) {
    throw new ApiError(httpStatus.NOT_FOUND, "Navigation route not found");
  }

  const result = await prisma.navigationRoute.update({
    where: { id },
    data: payload,
  });

  // Invalidate cache
  memoryCache.clearPattern(CACHE_KEY_PREFIX);

  return result;
};

// Seed default routes
const seedDefaultRoutes = async (): Promise<{ count: number }> => {
  const defaultRoutes = [
    // Website Routes
    {
      name: "website-transfer",
      label: "Transfers",
      path: "/transfer",
      icon: null,
      targetApp: AppTarget.WEBSITE,
      group: "main",
      order: 1,
      isActive: true,
      allowedRoles: [UserRole.USER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "website-tours",
      label: "Tours",
      path: "/multi-day-tours",
      icon: null,
      targetApp: AppTarget.WEBSITE,
      group: "main",
      order: 2,
      isActive: true,
      allowedRoles: [UserRole.USER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "website-travel-agent",
      label: "Travel Agent",
      path: "/auth/signup?role=AGENT",
      icon: null,
      targetApp: AppTarget.WEBSITE,
      group: "main",
      order: 3,
      isActive: true,
      allowedRoles: [UserRole.USER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "website-airport-transfers",
      label: "Airport Transfer",
      path: "/airport-transfers",
      icon: null,
      targetApp: AppTarget.WEBSITE,
      group: "main",
      order: 4,
      isActive: true,
      allowedRoles: [UserRole.USER, UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },


    // Dashboard Routes
    {
      name: "dashboard-home",
      label: "Dashboard",
      path: "/",
      icon: "RxDashboard",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 1,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-users",
      label: "Users",
      path: "/user-details",
      icon: "LuUsers",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 2,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-earnings",
      label: "Earnings",
      path: "/earnings",
      icon: "BsCurrencyDollar",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 3,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-bookings",
      label: "Bookings",
      path: "/bookings",
      icon: "FaCalendarCheck",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 4,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-vehicles",
      label: "Vehicles",
      path: "/vehicles",
      icon: "TbTruckDelivery",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 5,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-blogs",
      label: "Blogs",
      path: "/blogs",
      icon: "HiDocumentText",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 6,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-content",
      label: "Content",
      path: "/content",
      icon: "HiOutlineDocumentText",
      targetApp: AppTarget.DASHBOARD,
      group: "content",
      order: 7,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-memory",
      label: "Memories",
      path: "/memory",
      icon: "LuImage",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 8,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-reviews",
      label: "Reviews",
      path: "/reviews",
      icon: "FaStar",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 9,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-newsletter",
      label: "Newsletter",
      path: "/newsletter",
      icon: "HiOutlineMail",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 10,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-notifications",
      label: "Notifications",
      path: "/notifications",
      icon: "HiOutlineMail",
      targetApp: AppTarget.DASHBOARD,
      group: "main",
      order: 11,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-create-admin",
      label: "Create Admin",
      path: "/create-admin",
      icon: "MdAdminPanelSettings",
      targetApp: AppTarget.DASHBOARD,
      group: "admin",
      order: 12,
      isActive: true,
      allowedRoles: [UserRole.SUPER_ADMIN],
    },
    {
      name: "dashboard-settings",
      label: "Settings",
      path: "/settings",
      icon: "IoMdSettings",
      targetApp: AppTarget.DASHBOARD,
      group: "settings",
      order: 13,
      isActive: true,
      allowedRoles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    },
  ];

  let createdCount = 0;
  for (const route of defaultRoutes) {
    await prisma.navigationRoute.upsert({
      where: { name: route.name },
      update: {
        label: route.label,
        path: route.path,
        icon: route.icon,
        targetApp: route.targetApp,
        group: route.group,
        order: route.order,
      },
      create: route,
    });
    createdCount++;
  }

  memoryCache.clearPattern(CACHE_KEY_PREFIX);

  return { count: createdCount };
};

export const NavigationRouteService = {
  getAllNavigationRoutes,
  updateNavigationRoute,
  seedDefaultRoutes,
};
