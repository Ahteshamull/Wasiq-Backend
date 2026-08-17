import {
  BookingStatus,
  PaymentStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";
import prisma from "../../../shared/prisma";
import { IFilterRequest } from "./statistics.interface";
import { getDateRange } from "../../../helpars/filterByDate";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../../interfaces/paginations";
import { paginationHelpers } from "../../../helpars/paginationHelper";

// get overview total users, total agents,total revenue
const getOverview = async (params: IFilterRequest) => {
  const { timeRange, year } = params;
  const dateRange = getDateRange(timeRange);

  // total users
  const totalUsers = await prisma.user.count({
    where: {
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    },
  });

  // total agents
  const totalAgents = await prisma.user.count({
    where: {
      role: UserRole.AGENT,
      status: UserStatus.ACTIVE,
    },
  });

  // total revenue
  const totalRevenue = await prisma.payment.aggregate({
    where: {
      status: {
        in: [PaymentStatus.PAID],
      },
    },
    _sum: {
      admin_commission: true,
    },
  });

  // user chart data
  const filterYear = year ? parseInt(year) : new Date().getFullYear();
  const startOfYear = new Date(filterYear, 0, 1); // january 1st of selected year
  const endOfYear = new Date(filterYear, 11, 31, 23, 59, 59); // december 31st of selected year

  // revenue data by month
  const revenueData = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PAID,
      createdAt: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    select: {
      createdAt: true,
      admin_commission: true,
      amount: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // group users by months
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // user chart data
  const userChartData = await prisma.user.findMany({
    where: {
      role: UserRole.USER,
      createdAt: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // agent chart data
  const agentChartData = await prisma.user.findMany({
    where: {
      role: UserRole.AGENT,
      createdAt: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const userChart = monthNames.map((month, index) => {
    const monthUsers = userChartData.filter((user) => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === index && userDate.getFullYear() === filterYear
      );
    });

    const monthAgents = agentChartData.filter((agent) => {
      const agentDate = new Date(agent.createdAt);
      return (
        agentDate.getMonth() === index && agentDate.getFullYear() === filterYear
      );
    });

    return {
      month,
      userCount: monthUsers.length,
      agentCount: monthAgents.length,
    };
  });

  // revenue chart data
  const revenueChart = monthNames.map((month, index) => {
    const monthRevenue = revenueData.filter((payment) => {
      const paymentDate = new Date(payment.createdAt);
      return (
        paymentDate.getMonth() === index &&
        paymentDate.getFullYear() === filterYear
      );
    });

    const totalRevenue = monthRevenue.reduce(
      (sum, payment) => sum + (payment.admin_commission || 0),
      0,
    );

    return {
      month,
      revenue: totalRevenue,
    };
  });

  // recent users - last 5 users
  const recentUsers = await prisma.user.findMany({
    where: {
      role: UserRole.USER,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      profileImage: true,
      createdAt: true,
      status: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return {
    totalUsers: totalUsers || 0,
    totalAgents: totalAgents || 0,
    totalRevenue: totalRevenue._sum.admin_commission || 0,
    userChart,
    revenueChart,
    recentUsers,
    filterYear,
  };
};

// get agent total earnings and bookings
const getAgentTotalEarningsAndBookings = async (
  userId: string,
  timeRange?: string,
) => {
  // find agent
  const agent = await prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.AGENT,
    },
  });

  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, "Agent not found");
  }

  const dateRange = getDateRange(timeRange);

  // monthly bookings data
  const monthlyBookingsData = await prisma.tripServiceBooking.findMany({
    where: {
      OR: [
        { tripService: { userId } },
        { user: { createdById: userId } },
        { userId },
      ],
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
      ...(dateRange && { createdAt: dateRange }),
    },
    select: {
      createdAt: true,
      totalPrice: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // monthly earnings data
  const monthlyEarningsData = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PAID,
      tripServiceBooking: {
        OR: [
          { tripService: { userId } },
          { user: { createdById: userId } },
          { userId },
        ],
      },
      ...(dateRange && { createdAt: dateRange }),
    },
    select: {
      createdAt: true,
      agent_commission: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // group bookings by month
  const bookingsByMonth = monthlyBookingsData.reduce(
    (acc: Record<string, number>, booking) => {
      const key = booking.createdAt.toISOString().slice(0, 7);

      if (!acc[key]) acc[key] = 0;
      acc[key] += 1;

      return acc;
    },
    {},
  );

  // group earnings by month
  const earningsByMonth = monthlyEarningsData.reduce(
    (acc: Record<string, number>, payment) => {
      const key = payment.createdAt.toISOString().slice(0, 7);

      if (!acc[key]) acc[key] = 0;
      acc[key] += payment.agent_commission || 0;

      return acc;
    },
    {},
  );

  // current & Previous Month calculation
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(
    prevDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const currentBookings = bookingsByMonth[currentMonthKey] || 0;
  const prevBookings = bookingsByMonth[prevMonthKey] || 0;

  const currentEarnings = earningsByMonth[currentMonthKey] || 0;
  const prevEarnings = earningsByMonth[prevMonthKey] || 0;

  // growth calculation
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  };

  const bookingsGrowth = calculateGrowth(currentBookings, prevBookings);
  const earningsGrowth = calculateGrowth(currentEarnings, prevEarnings);

  const monthName = new Date(`${currentMonthKey}-01`).toLocaleString(
    "default",
    { month: "short" },
  );

  // recent bookings
  const recentBookings = await prisma.tripServiceBooking.findMany({
    where: {
      OR: [
        { tripService: { userId } },
        { user: { createdById: userId } },
        { userId },
      ],
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
    },
    select: {
      clientName: true,
      from: true,
      to: true,
      serviceType: true,
      timeSlot: true,
      status: true,
      isReturn: true,
      totalPrice: true,
      createdAt: true,
      updatedAt: true,
      payments: {
        select: {
          agent_commission: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          address: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    totalBookings: {
      month: monthName,
      value: currentBookings,
      growthOrDown: bookingsGrowth,
    },

    totalEarnings: {
      month: monthName,
      value: currentEarnings,
      growthOrDown: earningsGrowth,
    },

    recentBookings,
    timeRange: timeRange || "ALL_TIME",
  };
};

// get agent bookings
const getAgentBookings = async (
  userId: string,
  timeRange?: string,
  status?: string,
) => {
  // find agent
  const agent = await prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.AGENT,
    },
  });
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, "Agent not found");
  }

  // validate booking status
  const validStatuses = Object.values(BookingStatus);
  if (status && !validStatuses.includes(status as BookingStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid booking status. Valid statuses are: ${validStatuses.join(", ")}`,
    );
  }

  // date range filter
  const dateRange = getDateRange(timeRange);

  // total bookings
  const totalBookings = await prisma.tripServiceBooking.count({
    where: {
      OR: [
        { tripService: { userId } },
        { user: { createdById: userId } },
        { userId },
      ],
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
      ...(dateRange && { createdAt: dateRange }),
    },
  });

  // total confirmed booking
  const totalConfirmedBookings = await prisma.tripServiceBooking.count({
    where: {
      OR: [
        { tripService: { userId } },
        { user: { createdById: userId } },
        { userId },
      ],
      status: BookingStatus.CONFIRMED,
      ...(dateRange && { createdAt: dateRange }),
    },
  });
  // total completed booking
  const totalCompletedBookings = await prisma.tripServiceBooking.count({
    where: {
      OR: [
        { tripService: { userId } },
        { user: { createdById: userId } },
        { userId },
      ],
      status: BookingStatus.COMPLETED,
      ...(dateRange && { createdAt: dateRange }),
    },
  });

  // total earnings
  const totalEarnings = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.PAID,
      tripServiceBooking: {
        OR: [
          { tripService: { userId } },
          { user: { createdById: userId } },
          { userId },
        ],
      },
      ...(dateRange && { createdAt: dateRange }),
    },
    _sum: {
      agent_commission: true,
    },
    _count: {
      id: true,
    },
  });

  // recent bookings for agent (last 10)
  const recentBookings = await prisma.tripServiceBooking.findMany({
    where: {
      OR: [
        { tripService: { userId } },
        { user: { createdById: userId } },
        { userId },
      ],
      ...(status ? { status: status as BookingStatus } : {}),
    },
    select: {
      clientName: true,
      from: true,
      to: true,
      serviceType: true,
      timeSlot: true,
      status: true,
      isReturn: true,
      totalPrice: true,
      createdAt: true,
      updatedAt: true,
      payments: {
        select: {
          agent_commission: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          address: true,
          country: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  return {
    totalBookings,
    totalConfirmedBookings,
    totalCompletedBookings,
    totalEarnings: totalEarnings._sum.agent_commission || 0,
    recentBookings,
    timeRange: timeRange || "ALL_TIME",
  };
};
// get agent bookings
const getUserBookings = async (
  userId: string,
  timeRange?: string,
  status?: string,
  options?: IPaginationOptions,
) => {
  // find agent
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      role: UserRole.USER,
    },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // validate booking status
  const validStatuses = Object.values(BookingStatus);
  if (status && !validStatuses.includes(status as BookingStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid booking status. Valid statuses are: ${validStatuses.join(", ")}`,
    );
  }

  // date range filter
  const dateRange = getDateRange(timeRange);

  // pagination
  const { page, limit, skip } = paginationHelpers.calculatedPagination(
    options || {},
  );

  // total bookings
  const totalBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
      ...(dateRange && { createdAt: dateRange }),
    },
  });

  // total confirmed booking
  const totalConfirmedBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: BookingStatus.CONFIRMED,
      ...(dateRange && { createdAt: dateRange }),
    },
  });
  // total completed booking
  const totalCompletedBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: BookingStatus.COMPLETED,
      ...(dateRange && { createdAt: dateRange }),
    },
  });

  // total earnings
  const totalEarnings = await prisma.payment.aggregate({
    where: {
      status: PaymentStatus.PAID,
      userId,
      ...(dateRange && { createdAt: dateRange }),
    },
    _sum: {
      agent_commission: true,
    },
    _count: {
      id: true,
    },
  });

  // bookings where clause for list + count
  const bookingsWhere = {
    userId,
    ...(status ? { status: status as BookingStatus } : {}),
  };

  // total count for pagination
  const total = await prisma.tripServiceBooking.count({
    where: bookingsWhere,
  });

  // recent bookings for user (paginated)
  const recentBookings = await prisma.tripServiceBooking.findMany({
    where: bookingsWhere,
    select: {
      id: true,
      clientName: true,
      from: true,
      to: true,
      serviceType: true,
      timeSlot: true,
      status: true,
      isReturn: true,
      totalPrice: true,
      createdAt: true,
      updatedAt: true,
      payments: {
        select: {
          agent_commission: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          address: true,
          country: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  return {
    totalBookings,
    totalConfirmedBookings,
    totalCompletedBookings,
    totalEarnings: totalEarnings._sum.agent_commission || 0,
    meta: {
      total,
      page,
      limit,
    },
    data: recentBookings,
    timeRange: timeRange || "ALL_TIME",
  };
};

// get user dashboard tab info
const getUserDashboardTabInfo = async (userId: string, status?: string) => {
  // find user
  const findUser = await prisma.user.findUnique({
    where: {
      id: userId,
      role: UserRole.USER,
    },
  });
  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  // validate booking status
  const validStatuses = Object.values(BookingStatus);
  if (status && !validStatuses.includes(status as BookingStatus)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Invalid booking status. Valid statuses are: ${validStatuses.join(", ")}`,
    );
  }

  // total bookings
  const totalBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
    },
  });

  // total confirmed bookings (confirmed + completed)
  const totalConfirmedBookings = await prisma.tripServiceBooking.count({
    where: {
      userId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
    },
  });

  // total spent sum
  const totalSpentResult = await prisma.tripServiceBooking.aggregate({
    where: {
      userId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
    },
    _sum: {
      totalPrice: true,
    },
  });
  const totalSpent = totalSpentResult._sum.totalPrice || 0;

  // monthly bookings data
  const monthlyBookingsData = await prisma.tripServiceBooking.findMany({
    where: {
      userId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
    },
    select: {
      createdAt: true,
      totalPrice: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // monthly spent data
  const monthlySpentData = await prisma.tripServiceBooking.findMany({
    where: {
      userId,
      status: {
        in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
      },
    },
    select: {
      createdAt: true,
      totalPrice: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // group bookings by month
  const bookingsByMonth = monthlyBookingsData.reduce(
    (acc: Record<string, number>, booking) => {
      const key = booking.createdAt.toISOString().slice(0, 7);

      if (!acc[key]) acc[key] = 0;
      acc[key] += 1;

      return acc;
    },
    {},
  );

  // group spent by month
  const spentByMonth = monthlySpentData.reduce(
    (acc: Record<string, number>, booking) => {
      const key = booking.createdAt.toISOString().slice(0, 7);

      if (!acc[key]) acc[key] = 0;
      acc[key] += booking.totalPrice || 0;

      return acc;
    },
    {},
  );

  // current & previous Month calculation
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevDate.getFullYear()}-${String(
    prevDate.getMonth() + 1,
  ).padStart(2, "0")}`;

  const currentBookings = bookingsByMonth[currentMonthKey] || 0;
  const prevBookings = bookingsByMonth[prevMonthKey] || 0;

  const currentSpent = spentByMonth[currentMonthKey] || 0;
  const prevSpent = spentByMonth[prevMonthKey] || 0;

  // growth calculation
  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  };

  const bookingsGrowth = calculateGrowth(currentBookings, prevBookings);
  const spentGrowth = calculateGrowth(currentSpent, prevSpent);

  const monthName = new Date(`${currentMonthKey}-01`).toLocaleString(
    "default",
    { month: "short" },
  );

  // recent bookings with filter on status
  const recentBookings = await prisma.tripServiceBooking.findMany({
    where: {
      userId,
      ...(status ? { status: status as BookingStatus } : {}),
    },
    select: {
      clientName: true,
      from: true,
      to: true,
      serviceType: true,
      timeSlot: true,
      status: true,
      isReturn: true,
      totalPrice: true,
      createdAt: true,
      updatedAt: true,
      payments: {
        select: {
          agent_commission: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          address: true,
          country: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    totalBookings: {
      month: monthName,
      value: totalBookings,
      growthOrDown: bookingsGrowth,
    },
    totalConfirmedBookings: totalConfirmedBookings || 0,
    totalSpent: {
      month: monthName,
      value: totalSpent,
      growthOrDown: spentGrowth,
    },
    recentBookings,
  };
};

// admin earns
const getAdminTotalEarnings = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  // total payments
  const totalPayments = await prisma.payment.aggregate({
    where: {
      status: {
        in: [PaymentStatus.PAID],
      },
      isDeleted: false,
    },
    _sum: {
      admin_commission: true,
    },
  });

  // completed rides
  const completedRides = await prisma.tripServiceBooking.count({
    where: {
      status: {
        in: [BookingStatus.COMPLETED],
      },
    },
  });

  const total = await prisma.payment.count({
    where: {
      status: {
        in: [PaymentStatus.PAID],
      },
      isDeleted: false,
    },
  });

  const averageEarnings =
    total > 0 && totalPayments._sum.admin_commission
      ? Number((totalPayments._sum.admin_commission / total).toFixed(2))
      : 0;

  // total payment database info
  const paymentInfo = await prisma.payment.findMany({
    where: {
      status: {
        in: [PaymentStatus.PAID],
      },
      isDeleted: false,
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    totalPayments: totalPayments._sum.admin_commission || 0,
    completedRides,
    averageEarnings,
    meta: {
      total,
      page,
      limit,
    },
    data: paymentInfo,
  };
};

// admin booking
const getAdminTotalBookings = async (options: IPaginationOptions & { status?: string }) => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);
  const { status } = options;

  if (status) {
    const validStatuses = Object.values(BookingStatus);
    if (!validStatuses.includes(status as BookingStatus)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid booking status");
    }
  }

  const where = status
    ? { status: status as BookingStatus }
    : {
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      };

  // total payments
  const totalBookings = await prisma.tripServiceBooking.count({
    where,
  });

  // completed rides
  const completedRides = await prisma.tripServiceBooking.count({
    where: {
      status: {
        in: [BookingStatus.COMPLETED],
      },
    },
  });

  // total bookings database info
  const bookingInfo = await prisma.tripServiceBooking.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          profileImage: true,
          contactNumber: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    totalBookings,
    completedRides,
    meta: {
      totalBookings,
      page,
      limit,
    },
    data: bookingInfo,
  };
};

// admin reviews
const getAdminTotalReviews = async (options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelpers.calculatedPagination(options);

  // total reviews
  const totalReviews = await prisma.review.count();

  // average rating
  const averageRating = await prisma.review.aggregate({
    _avg: {
      rating: true,
    },
  });

  // total 5-star reviews
  const total5StarReview = await prisma.review.count({
    where: {
      rating: 5,
    },
  });

  // total reviews database info
  const reviewInfo = await prisma.review.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    totalReviews,
    averageRating,
    total5StarReview,
    meta: {
      totalReviews,
      page,
      limit,
    },
    data: reviewInfo,
  };
};

export const StatisticsService = {
  getOverview,

  // sales
  getAgentTotalEarningsAndBookings,
  getAgentBookings,
  getUserBookings,
  getUserDashboardTabInfo,
  getAdminTotalBookings,
  getAdminTotalReviews,

  // admin earns
  getAdminTotalEarnings,
};
