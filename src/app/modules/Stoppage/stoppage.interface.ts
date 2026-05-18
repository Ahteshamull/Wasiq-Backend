import { Stoppage } from "@prisma/client";

export type IStoppage = Omit<Stoppage, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  from?: string;
  to?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type IStoppageFilters = {
  searchTerm?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
};

export type IStoppageResponse = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: IStoppage[];
};

export interface ISearchableStoppage {
  to: {
    location: string;
    coordinates: [number, number];
  };
  from: {
    location: string;
    coordinates: [number, number];
  };
}

export interface IAddExtraStoppage {
  location?: string;
  coordinates?: [number, number];
  latitude?: number;
  longitude?: number;
}

