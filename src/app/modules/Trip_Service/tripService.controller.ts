import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { TripServiceService } from "./tripService.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { ITripService } from "./tripService.interface";
import { uploadFile } from "../../../helpars/fileUploader";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

// create trip service
const createTripService = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const userId = req.user?.id;
  const tripServiceData = req.body;

  // check if images are provided
  if (!files?.image || files.image.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Images are required",
      data: null,
    });
  }

  // handle image uploads
  let imageUrls: string[] = [];
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // image with tripServiceData
  const finalTripServiceData = {
    ...tripServiceData,
    images: imageUrls.length > 0 ? imageUrls : [],
  };

  const result = await TripServiceService.createTripService(
    userId,
    finalTripServiceData,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Trip service created successfully",
    data: result,
  });
});

// get all trip services
const getAllTripServices = catchAsync(async (req: Request, res: Response) => {
  const filters = req.query;
  const options = {
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await TripServiceService.getAllTripServices(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip services retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// ----------------- by the hour -----------------

// get all trip services BY_THE_HOUR
const getByTheHourTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result = await TripServiceService.getByTheHourTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "BY_THE_HOUR Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get all trip services BY_THE_HOUR and isPopular
const getByTheHourPopularTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getByTheHourPopularTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "BY_THE_HOUR and isPopular Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// ----------------- day trip -----------------

// create day trip service
const createDayTripService = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const userId = req.user?.id;
  const tripServiceData = req.body;

  // check if images are provided
  if (!files?.image || files.image.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Images are required",
      data: null,
    });
  }

  // handle image uploads
  let imageUrls: string[] = [];
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // image with tripServiceData
  const finalTripServiceData = {
    ...tripServiceData,
    images: imageUrls.length > 0 ? imageUrls : [],
  };

  const result = await TripServiceService.createDayTripService(
    userId,
    finalTripServiceData,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Day Trip service created successfully",
    data: result,
  });
});

//create Explore service
const createExploreService = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  const userId = req.user?.id;
  const tripServiceData = req.body;

  // check if images are provided
  if (!files?.image || files.image.length === 0) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Images are required",
      data: null,
    });
  }

  // handle image uploads
  let imageUrls: string[] = [];
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  // image with tripServiceData
  const finalTripServiceData = {
    ...tripServiceData,
    images: imageUrls.length > 0 ? imageUrls : [],
  };

  const result = await TripServiceService.createExploreService(
    userId,
    finalTripServiceData,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Explore service created successfully",
    data: result,
  });
});

//get explore service
const getExploreService = catchAsync(async (req: Request, res: Response) => {
  const options = pick(req.query, paginationFields);
  const location = req.query.location as string | undefined;

  const result = await TripServiceService.getExploreService(options, location);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Explore services retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

// get all trip services BY_THE_DAY
const getDayTripTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result = await TripServiceService.getDayTripTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "BY_THE_DAY Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get all trip services BY_THE_DAY and isPopular
const getDayTripPopularTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getDayTripPopularTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "BY_THE_DAY and isPopular Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get trip service DAY_TRIP on the from location group
const getDayTripTripServicesByFromLocationGroup = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getDayTripTripServicesByFromLocationGroup(
        options,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "DAY_TRIP Trip services retrieved successfully by from location group",
      data: result.data,
      meta: result.meta,
    });
  },
);

// ----------------- multi day tour -----------------

// create multi day tour trip service
const createMultiDayTourTripService = catchAsync(
  async (req: Request, res: Response) => {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const userId = req.user?.id;
    const tripServiceData = req.body;

    if (
      !tripServiceData.title ||
      typeof tripServiceData.title !== "string" ||
      tripServiceData.title.trim() === ""
    ) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Title is required",
        data: {
          field: "title",
          error: "Title field is required",
        },
      });
    }

    if (!tripServiceData.price || isNaN(Number(tripServiceData.price))) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Price is required and must be a number",
        data: {
          field: "price",
          error: "Price field is required and must be a valid number",
        },
      });
    }

    if (!files?.image || files.image.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "Images are required",
        data: null,
      });
    }

    // handle image uploads
    let imageUrls: string[] = [];
    if (files?.image && files.image.length > 0) {
      const uploadPromises = files.image.map((file) =>
        uploadFile.uploadToCloudinary(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      imageUrls = uploadResults
        .filter(
          (result): result is NonNullable<typeof result> =>
            result !== undefined,
        )
        .map((result) => result.secure_url);
    }

    // image with tripServiceData
    const finalTripServiceData = {
      ...tripServiceData,
      images: imageUrls.length > 0 ? imageUrls : [],
    };

    const result = await TripServiceService.createMultiDayTourTripService(
      userId,
      finalTripServiceData,
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Multi Day Tour Trip service created successfully",
      data: result,
    });
  },
);

// get all trip services MULTI_DAY_TOUR
const getMultiDayTourTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getMultiDayTourTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "MULTI_DAY_TOUR Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get all trip services MULTI_DAY_TOUR and isPopular
const getMultiDayTourPopularTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getMultiDayTourPopularTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "MULTI_DAY_TOUR and isPopular Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get trip service MULTI_DAY_TOUR on the tourDays group
const getMultiDayTourTripServicesByTourDaysGroup = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getMultiDayTourTripServicesByTourDaysGroup(
        options,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "MULTI_DAY_TOUR Trip services retrieved successfully by tour days group",
      data: result.data,
      meta: result.meta,
    });
  },
);

// ----------------- private transfer -----------------

// get all trip services PRIVATE_TRANSFER
const getPrivateTransferTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const passengers = req.query.passengers
      ? parseInt(req.query.passengers as string)
      : undefined;

    const result = await TripServiceService.getPrivateTransferTripServices(
      options,
      passengers,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "PRIVATE_TRANSFER Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get all trip services PRIVATE_TRANSFER and isPopular
const getPrivateTransferPopularTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getPrivateTransferPopularTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "PRIVATE_TRANSFER and isPopular Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get trip service PRIVATE_TRANSFER on the from location group
const getPrivateTransferTripServicesByFromLocationGroup = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getPrivateTransferTripServicesByFromLocationGroup(
        options,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "PRIVATE_TRANSFER Trip services retrieved successfully by from location group",
      data: result.data,
      meta: result.meta,
    });
  },
);

// ----------------- airport transfer -----------------

// get all trip services AIRPORT_TRANSFER
const getAirportTransferTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getAirportTransferTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "AIRPORT_TRANSFER Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get all trip services AIRPORT_TRANSFER and isPopular
const getAirportTransferPopularTripServices = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const result =
      await TripServiceService.getAirportTransferPopularTripServices(options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "AIRPORT_TRANSFER and isPopular Trip services retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

// get single trip service
const getSingleTripService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await TripServiceService.getSingleTripService(id);

  sendResponse<ITripService>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip service retrieved successfully",
    data: result,
  });
});

// update trip service
const updateTripService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData = req.body;

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };

  // image uploads
  let imageUrls: string[] = [];
  if (files?.image && files.image.length > 0) {
    const uploadPromises = files.image.map((file) =>
      uploadFile.uploadToCloudinary(file),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults
      .filter(
        (result): result is NonNullable<typeof result> => result !== undefined,
      )
      .map((result) => result.secure_url);
  }

  const finalUpdateData = {
    ...updateData,
    ...(imageUrls.length > 0 && { images: imageUrls }),
  };

  const result = await TripServiceService.updateTripService(
    id,
    finalUpdateData,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip service updated successfully",
    data: result,
  });
});

// delete trip service
const deleteTripService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await TripServiceService.deleteTripService(id);

  sendResponse<ITripService>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Trip service deleted successfully",
    data: result,
  });
});

// get modal specific data by location
const getTripsByLocationForModal = catchAsync(
  async (req: Request, res: Response) => {
    const options = pick(req.query, paginationFields);
    const location = req.query.location as string | undefined;
    const serviceType = req.query.serviceType as any;

    const result = await TripServiceService.getTripsByLocationForModal(
      options,
      location,
      serviceType,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Trip services for modal retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

export const TripServiceController = {
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

  // explore
  createExploreService,
  getExploreService,

  // modal
  getTripsByLocationForModal,
};
