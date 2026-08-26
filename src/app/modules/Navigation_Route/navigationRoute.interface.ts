import { AppTarget, UserRole } from "@prisma/client";

export interface INavigationRoute {
  id?: string;
  name: string;
  label: string;
  path: string;
  icon?: string | null;
  targetApp: AppTarget;
  group?: string | null;
  order?: number;
  isActive?: boolean;
  allowedRoles?: UserRole[];
}

export interface INavigationRouteFilter {
  targetApp?: AppTarget;
  isActive?: boolean;
  group?: string;
}
