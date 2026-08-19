import { ServiceType } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { memoryCache } from "../../../shared/utils/cache";

// create faq
const createFaq = async (payload: any) => {
  const faq = await prisma.faq.create({ data: payload });
  memoryCache.clearPattern("faqs:");
  return faq;
};

// get all faq
const getAllFaq = async (query: Record<string, any>) => {
  const cacheKey = `faqs:${JSON.stringify(query)}`;
  const cached = memoryCache.get<any[]>(cacheKey);
  if (cached) return cached;

  const { serviceType } = query;
  const whereCondition: any = {};
  if (serviceType && Object.values(ServiceType).includes(serviceType as ServiceType)) {
    whereCondition.serviceType = serviceType as ServiceType;
  }
  const faq = await prisma.faq.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
  });
  memoryCache.set(cacheKey, faq, 300000); // 5 mins cache
  return faq;
};

// get single faq
const getSingleFaq = async (id: string) => {
  const faq = await prisma.faq.findUnique({
    where: { id },
  });
  return faq;
};

// update faq
const updateFaq = async (id: string, payload: any) => {
  const { question, answer, serviceType } = payload;
  const faq = await prisma.faq.update({
    where: { id },
    data: {
      question,
      answer,
      serviceType,
    } as any,
  });
  memoryCache.clearPattern("faqs:");
  return faq;
};

// delete faq
const deleteFaq = async (id: string) => {
  const faq = await prisma.faq.delete({ where: { id } });
  memoryCache.clearPattern("faqs:");
  return faq;
};

export const FaqService = {
  createFaq,
  getAllFaq,
  getSingleFaq,
  updateFaq,
  deleteFaq,
};
