import { Prisma, UserRole } from '@prisma/client';

// --- Signup DTO ---
export interface SignupDTO {
  email: string;
  password: string;
  username?: string | null;
  image?: string | null;
  nationalId?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  location?: string | null;
  companyName?: string | null;
  companyRegistrationNumber?: string | null;
  businessSector?: string | null;
  fleetSize?: number | null;
  language?: string | null;
  notificationPreference?: string | null;
  role?: UserRole;
  status?: string;
}

// --- Login DTO ---
export interface LoginDTO {
  email: string;
  password: string;
}

// --- Change Password DTO ---
export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

// --- Request Password Reset DTO ---
export interface RequestPasswordResetDTO {
  email: string;
}

// --- Reset Password DTO ---
export interface ResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
}

// --- Change Role DTO ---
export interface ChangeRoleDTO {
  role: UserRole;
}

// --- Create User DTO ---
// Use Prisma's create input, omit nested relations
export type CreateUserDTO = Omit<
  Prisma.UserCreateInput,
  | 'vehicles'
  | 'trackingDevices'
  | 'alerts'
  | 'reports'
  | 'activityLogs'
  | 'userNotifications'
> & { password: string }; // password required

// --- Update User DTO ---
export type UpdateUserDTO = Prisma.UserUpdateInput;

// --- Params for methods that require userId ---
export interface UserIdParam {
  id: string; // or number, if you parse to number in controller
}

export interface PaginationMeta {
  page: number;        // current page number
  limit: number;       // items per page
  totalItems: number;  // total number of items matching the query
  totalPages: number;  // total number of pages
  hasNextPage: boolean; // true if there's a next page
  hasPrevPage: boolean; // true if there's a previous page
}
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface UserFilterParams {
  search?: string;
  role?: UserRole;
  status?: string;
}

export interface UserSortParams {
  sortBy?: Prisma.UserScalarFieldEnum;
  sortOrder?: 'asc' | 'desc';
}
export interface UserListQueryDTO extends PaginationParams, UserFilterParams, UserSortParams {}