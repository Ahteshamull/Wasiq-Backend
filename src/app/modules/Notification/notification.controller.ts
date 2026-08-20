import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { NotificationService } from "./notification.service";
import sendResponse from "../../../shared/sendResponse";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

// send single notification
const sendSingleNotification = catchAsync(
  async (req: Request, res: Response) => {
    // const payload = req.body;
    const notification = await NotificationService.sendSingleNotification(req);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "notification sent successfully",
      data: notification,
    });
  }
);

// send notifications
const sendNotifications = catchAsync(async (req: Request, res: Response) => {
  const notifications = await NotificationService.sendNotifications(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "notifications sent successfully",
    data: notifications,
  });
});

const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, [...paginationFields, "read"]);
  const notifications = await NotificationService.getAllNotifications(options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notifications retrieved successfully",
    data: notifications,
  });
});

// get single notification
const getSingleNotificationById = catchAsync(
  async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId;
    const notification = await NotificationService.getSingleNotificationFromDB(
      req,
      notificationId
    );

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Notification retrieved successfully",
      data: notification,
    });
  }
);

const getMyNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const options = pick(req.query, [...paginationFields, "read"]);
  const result = await NotificationService.getMyNotifications(userId, options);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My notifications retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// delete notification
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const notificationId = req.params.notificationId;
  const userId = (req as any).user.id;
  const notification = await NotificationService.deleteNotification(
    notificationId,
    userId
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification deleted successfully",
    data: notification,
  });
});

// mark as read notification
const markAsReadNotification = catchAsync(
  async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const notification = await NotificationService.markAsReadNotification(
      notificationId,
      userId,
      role
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Notification marked as read successfully",
      data: notification,
    });
  }
);

// mark as unread notification
const markAsUnreadNotification = catchAsync(
  async (req: Request, res: Response) => {
    const notificationId = req.params.notificationId;
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const notification = await NotificationService.markAsUnreadNotification(
      notificationId,
      userId,
      role
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Notification marked as unread successfully",
      data: notification,
    });
  }
);

const markAllAsReadNotification = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const role = (req as any).user.role;
    const notification =
      await NotificationService.markAllAsReadNotification(userId, role);
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "All notifications marked as read successfully",
      data: notification,
    });
  }
);

export const NotificationController = {
  sendSingleNotification,
  sendNotifications,
  getAllNotifications,
  getSingleNotificationById,
  getMyNotifications,
  deleteNotification,
  markAsReadNotification,
  markAsUnreadNotification,
  markAllAsReadNotification,
};
