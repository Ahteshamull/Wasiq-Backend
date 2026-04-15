import { TripService } from "@prisma/client";

export type ITripService = Omit<
  TripService,
  "id" | "createdAt" | "updatedAt"
> & {
  id?: string;
  title?: string | null;
  duration?: string | null;
  startTime?: string | null;
  groupSize?: string | null;
  pickup?: string | null;
  includedContent?: string[];
  excludedContent?: string[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type ITripServiceFilters = {
  search?: string;
  from?: string;
  to?: string;
  minPrice?: number;
  maxPrice?: number;
  routeType?: string;
  isPopular?: boolean;
};

export type ITripServiceResponse = {
  data: ITripService[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};
