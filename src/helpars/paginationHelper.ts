type IOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

type IOptionsResult = {
  page: number;
  limit: number | undefined;
  skip: number;
  sortBy: string;
  sortOrder: string;
};

const calculatedPagination = (options: IOptions): IOptionsResult => {
  const page = Number(options.page) || 1;
  const limit = options.limit ? Number(options.limit) : undefined;
  const skip = (page - 1) * (limit ?? 0);
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

export const paginationHelpers = {
  calculatedPagination,
};
