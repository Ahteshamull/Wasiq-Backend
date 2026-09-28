import { CustomerContact } from "@prisma/client";

export type ICustomerContact = Omit<
  CustomerContact,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ICustomerContactFilters = {
  search?: string;
  minDate?: string;
  maxDate?: string;
  startDate?: string;
  endDate?: string;
};

export type ICustomerContactResponse = {
  data: ICustomerContact[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};
