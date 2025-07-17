import { Prisma, User, UserRole, UserStatus } from '@prisma/client';
import { PaginationMeta, PaginationParams } from './GlobalTypes';



// --- Core User Types ---
export type UserBasicInfo = Pick<
  User,
  | 'id'
  | 'username'
  | 'email'
  | 'image'
  | 'phoneNumber'
  | 'companyName'
  | 'role'
  | 'status'
>;



export interface UserListItemWithCounts extends UserBasicInfo {
  createdAt: Date;
  updatedAt: Date;
  _count: {
    vehicles: number;
    trackingDevices: number;
    alerts: number;
    reports: number;
    activityLogs: number;
    userNotifications: number;
  };
}

export interface InternalUser extends UserBasicInfo {
  password: string;
}
export type GetUserByIdResponse = Pick<
  User,
  | 'id'
  | 'username'
  | 'email'
  | 'image'
  |'gender'
  | 'phoneNumber'
  | 'companyName'
  | 'notificationPreference'
  | 'businessSector'
  | 'language'
  | 'role'
  | 'status'
  | 'location'
  | 'createdAt'
  | 'updatedAt'
> & {
  _count: {
    vehicles: number;
    trackingDevices: number;
    alerts: number;
    reports: number;
    activityLogs: number;
    userNotifications: number;
  };
  vehicles: Array<{
    id: number;
    plateNumber: string;
    vehicleModel: string;
    status: string;
    emissionStatus: string;
  }>;
  trackingDevices: Array<{
    id: number;
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  }>;
  alerts: Array<{
    id: number;
    type: string;
    title: string;
    isRead: boolean;
    createdAt: Date;
  }>;

};
// --- Auth DTOs ---
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
  status?: UserStatus;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
}

export interface RequestPasswordResetDTO {
  email: string;
}

export interface ResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
}

// --- User Management DTOs ---
export interface ChangeRoleDTO {
  role: UserRole;
}

export type CreateUserDTO = Omit<
  Prisma.UserCreateInput,
  | 'id' 
  | 'vehicles'
  | 'trackingDevices'
  | 'alerts'
  | 'reports'
  | 'activityLogs'
  | 'userNotifications'
> & { password: string };


export type UpdateUserDTO = Partial<
  Omit<
    User,
    | 'id'
    | 'password'
    | 'role'
    | 'status'
    | 'otp'
    | 'otpExpiresAt'
    | 'token'
    | 'verified'
    | 'deletedAt'
    | 'createdAt'
    | 'updatedAt'
    | 'companyRegistrationNumber'
    | 'fleetSize'
  >
>;
// --- Query Params ---
export interface UserIdParam {
  id: string;
}

export interface UserListQueryDTO extends PaginationParams {
  filters?: {
    status?: UserStatus;
    role?: UserRole;
    verified?: boolean;
     gender?: string;
    language?: string;
    companyName?: string;
  };
  includeDeleted?: boolean;
  deletedOnly?: boolean;
}


export interface UserListResponse {
  data: UserListItemWithCounts[];
  meta: PaginationMeta;
}

export interface UserWithRelationsResponse extends GetUserByIdResponse {}