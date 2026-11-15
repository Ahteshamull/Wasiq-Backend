import { Blog } from "@prisma/client";

export type IBlog = Omit<Blog, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type IBlogFilters = {
  search?: string;
  category?: string;
  minDate?: string;
  maxDate?: string;
};

export type IBlogResponse = {
  data: IBlog[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
};
