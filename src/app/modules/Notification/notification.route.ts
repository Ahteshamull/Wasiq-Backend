import express from "express";
import auth from "../../middlewares/auth";
import { NotificationController } from "./notification.controller";
import { UserRole } from "@prisma/client";

const router = express.Router();

// get my all notifications
router.get(
  "/my-notifications",
  auth(),
  NotificationController.getMyNotifications,
);

// send single notification
router.post(
  "/send-notification",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.sendSingleNotification,
);

// send notifications to all users
router.post(
  "/send-notifications",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.sendNotifications,
);

// get all notifications
router.get(
  "/all-notifications",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.getAllNotifications,
);

// get single notification
router.get(
  "/get-notification/:notificationId",
  auth(),
  NotificationController.getSingleNotificationById,
);

// delete notification
router.delete(
  "/delete-notification/:notificationId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  NotificationController.deleteNotification,
);

// mark all as read notification
router.patch(
  "/mark-all-as-read",
  auth(),
  NotificationController.markAllAsReadNotification,
);

// mark as read notification
router.patch(
  "/mark-as-read/:notificationId",
  auth(),
  NotificationController.markAsReadNotification,
);

// mark as unread notification
router.patch(
  "/mark-as-unread/:notificationId",
  auth(),
  NotificationController.markAsUnreadNotification,
);

export const notificationsRoute = router;
