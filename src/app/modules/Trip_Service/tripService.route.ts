import express from "express";
import { TripServiceController } from "./tripService.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { TripServiceValidation } from "./tripService.validation";
import validateRequest from "../../middlewares/validateRequest";
import { uploadFile } from "../../../helpars/fileUploader";
import { parseBodyData } from "../../middlewares/parseNestedJson";

const router = express.Router();

// create trip service
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(TripServiceValidation.createTripServiceValidationSchema),
  TripServiceController.createTripService,
);

// get all trip services
router.get("/", TripServiceController.getAllTripServices);

// ----------------- explore -----------------

// create explore service
router.post(
  "/explore",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(TripServiceValidation.createExploreServiceValidationSchema),
  TripServiceController.createExploreService,
);

// get all trip services EXPLORE  ?location=sligo
router.get("/all/explore", TripServiceController.getExploreService);

// ----------------- by the hour -----------------

// get all trip services BY_THE_HOUR
router.get("/by-the-hour", TripServiceController.getByTheHourTripServices);

// get all trip services BY_THE_HOUR and isPopular
router.get(
  "/by-the-hour/popular",
  TripServiceController.getByTheHourPopularTripServices,
);

// ----------------- day trip -----------------

// create day trip service
router.post(
  "/day-trip",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(TripServiceValidation.createDayTripServiceValidationSchema),
  TripServiceController.createDayTripService,
);

// get all trip services DAY_TRIP
router.get("/day-trip", TripServiceController.getDayTripTripServices);

// get all trip services DAY_TRIP and isPopular
router.get(
  "/day-trip/popular",
  TripServiceController.getDayTripPopularTripServices,
);

// get trip service DAY_TRIP on the from location group
router.get(
  "/day-trip/from-location-group",
  TripServiceController.getDayTripTripServicesByFromLocationGroup,
);

// ----------------- multi day tour -----------------

// create multi day tour trip service
router.post(
  "/multi-day-tour",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(
    TripServiceValidation.createMultiDayTourTripServiceValidationSchema,
  ),
  TripServiceController.createMultiDayTourTripService,
);

// get all trip services MULTI_DAY_TOUR
router.get(
  "/multi-day-tour",
  TripServiceController.getMultiDayTourTripServices,
);

// get all trip services MULTI_DAY_TOUR and isPopular
router.get(
  "/multi-day-tour/popular",
  TripServiceController.getMultiDayTourPopularTripServices,
);

// get trip service MULTI_DAY_TOUR on the tourDays group
router.get(
  "/multi-day-tour/tour-days-group",
  TripServiceController.getMultiDayTourTripServicesByTourDaysGroup,
);

// ----------------- private transfer -----------------

// get all trip services PRIVATE_TRANSFER
router.get(
  "/private-transfer",
  TripServiceController.getPrivateTransferTripServices,
);

// get all trip services PRIVATE_TRANSFER and isPopular
router.get(
  "/private-transfer/popular",
  TripServiceController.getPrivateTransferPopularTripServices,
);

// get trip service PRIVATE_TRANSFER on the from location group
router.get(
  "/private-transfer/from-location-group",
  TripServiceController.getPrivateTransferTripServicesByFromLocationGroup,
);

// ----------------- airport transfer -----------------

// get all trip services AIRPORT_TRANSFER
router.get(
  "/airport-transfer",
  TripServiceController.getAirportTransferTripServices,
);

// get all trip services TRANSFER
router.get("/transfer", TripServiceController.getTransferTripServices);

// get all trip services TRANSFER and isPopular
router.get(
  "/transfer/popular",
  TripServiceController.getTransferPopularTripServices,
);

// get all trip services AIRPORT_TRANSFER and isPopular
router.get(
  "/airport-transfer/popular",
  TripServiceController.getAirportTransferPopularTripServices,
);

// get single trip service
router.get("/:id", TripServiceController.getSingleTripService);

// update trip service
router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  uploadFile.upload.fields([{ name: "image", maxCount: 40 }]),
  parseBodyData,
  validateRequest(TripServiceValidation.updateTripServiceValidationSchema),
  TripServiceController.updateTripService,
);

// delete trip service
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  TripServiceController.deleteTripService,
);

router.get(
  "/from-location/:location",
  TripServiceController.getTripServicesByFromLocation,
);

export const tripServiceRoutes = router;
