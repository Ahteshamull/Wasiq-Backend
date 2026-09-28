import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { CustomerContactService } from "./customerContact.service";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { pick } from "../../../shared/pick";
import { paginationFields } from "../../../constants/pagination";

// create customer contact
const createCustomerContact = catchAsync(
  async (req: Request, res: Response) => {
    const customerContactData = req.body;

    const result =
      await CustomerContactService.createCustomerContact(customerContactData);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Customer contact created successfully",
      data: result,
    });
  },
);

// get all customer contacts
const getAllCustomerContacts = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, [
      "search",
      "minDate",
      "maxDate",
      "startDate",
      "endDate",
    ]);
    const options = pick(req.query, paginationFields);

    const result = await CustomerContactService.getAllCustomerContacts(
      filters,
      options,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Customer contacts retrieved successfully",
      data: result,
    });
  },
);

// get single customer contact
const getSingleCustomerContact = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await CustomerContactService.getSingleCustomerContact(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Customer contact retrieved successfully",
      data: result,
    });
  },
);

// update customer contact
const updateCustomerContact = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerContactData = req.body;

    const result = await CustomerContactService.updateCustomerContact(
      id,
      customerContactData,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Customer contact updated successfully",
      data: result,
    });
  },
);

// delete customer contact
const deleteCustomerContact = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await CustomerContactService.deleteCustomerContact(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Customer contact deleted successfully",
      data: result,
    });
  },
);

export const CustomerContactController = {
  createCustomerContact,
  getAllCustomerContacts,
  getSingleCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
};
