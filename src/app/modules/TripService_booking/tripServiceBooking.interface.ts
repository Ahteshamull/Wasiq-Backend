import { ServiceType } from "@prisma/client";

export interface ICreateTripServiceBooking {
  clientName?: string;
  tripServiceId?: string;
  from: string;
  fromLat?: number;
  fromLng?: number;
  to: string;
  toLat?: number;
  toLng?: number;
  serviceType: ServiceType;
  travelDate: Date;
  timeSlot?: any;
  passengers: number;
  distanceKm?: number;
  luggage?: number;
  basePrice: number;
  vehiclePrice: number;
  stoppagePrice?: number;
  totalPrice: number;
  returnPrice?: number;
  isReturn?: boolean;
  returnDate?: Date;
  user_role?: string;
  bookingVehicles?: Array<{
    vehicleId: string;
    quantity: number;
  }>;
  bookingStoppages?: Array<{
    stoppageId: string;
    quantity: number;
  }>;
  guestInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
}

