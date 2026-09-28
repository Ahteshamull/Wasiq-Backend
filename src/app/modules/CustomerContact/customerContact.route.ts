import { Router } from "express";
import { CustomerContactController } from "./customerContact.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { CustomerContactValidation } from "./customerContact.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// ========================================================
// Action-oriented API Endpoints (Primary)
// ========================================================

// create customer contact (public)
router.post(
  "/create-customer-contact",
  validateRequest(CustomerContactValidation.createCustomerContactValidation),
  CustomerContactController.createCustomerContact,
);

// get all customer contacts (admin only)
router.get(
  "/get-all-customer-contacts",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerContactController.getAllCustomerContacts,
);

// get single customer contact (admin only)
router.get(
  "/get-customer-contact/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerContactController.getSingleCustomerContact,
);

// update customer contact (admin only)
router.patch(
  "/update-customer-contact/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(CustomerContactValidation.updateCustomerContactValidation),
  CustomerContactController.updateCustomerContact,
);

// delete customer contact (admin only)
router.delete(
  "/delete-customer-contact/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerContactController.deleteCustomerContact,
);

// ========================================================
// RESTful aliases for backward compatibility with existing frontends
// ========================================================

router.post(
  "/",
  validateRequest(CustomerContactValidation.createCustomerContactValidation),
  CustomerContactController.createCustomerContact,
);

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerContactController.getAllCustomerContacts,
);

router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerContactController.getSingleCustomerContact,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(CustomerContactValidation.updateCustomerContactValidation),
  CustomerContactController.updateCustomerContact,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CustomerContactController.deleteCustomerContact,
);

export const customerContactRoutes = router;
