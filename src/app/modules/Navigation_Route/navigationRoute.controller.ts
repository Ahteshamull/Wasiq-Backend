import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { NavigationRouteService } from "./navigationRoute.service";
import { AppTarget } from "@prisma/client";

const getAllNavigationRoutes = catchAsync(
  async (req: Request, res: Response) => {
    const { targetApp, isActive, group } = req.query;

    const filters = {
      targetApp: targetApp ? (targetApp as AppTarget) : undefined,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      group: group as string | undefined,
    };

    const userRole = (req as any).user?.role;
    const result = await NavigationRouteService.getAllNavigationRoutes(
      filters,
      userRole,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Navigation routes fetched successfully",
      data: result,
    });
  },
);

const updateNavigationRoute = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await NavigationRouteService.updateNavigationRoute(
      id,
      req.body,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Navigation route updated successfully",
      data: result,
    });
  },
);

const seedDefaultRoutes = catchAsync(async (req: Request, res: Response) => {
  const result = await NavigationRouteService.seedDefaultRoutes();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Default navigation routes seeded successfully",
    data: result,
  });
});

export const NavigationRouteController = {
  getAllNavigationRoutes,
  updateNavigationRoute,
  seedDefaultRoutes,
};
