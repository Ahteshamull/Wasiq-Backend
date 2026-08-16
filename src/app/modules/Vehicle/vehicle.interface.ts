import { Vehicle } from "@prisma/client";

export type IVehicle = Omit<Vehicle, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type IVehicleFilters = {
  search?: string;
  minSeatCount?: number;
  maxSeatCount?: number;
  isActive?: boolean;
};

export type IVehicleResponse = {
  data: IVehicle[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};
