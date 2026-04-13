export interface INewsletterSubscriber {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ICreateNewsletterSubscriber {
  email: string;
}

export interface INewsletterFilter {
  searchTerm?: string;
  isActive?: boolean;
}

export interface IDiscountEmailData {
  // discountCode: string;
  discountPercentage: number;
  discountDescription: string;
  expiryDate: string;
  subject?: string;
  websiteUrl?: string;
}

export type INewsletterResponse = {
  meta: {
    total: number;
    page: number;
    limit: number | undefined;
  };
  data: INewsletterSubscriber[];
};
