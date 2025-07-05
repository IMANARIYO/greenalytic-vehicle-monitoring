import { User, UserRole, UserStatus } from "@prisma/client";

export interface Userr {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'FLEET_MANAGER';
  createdAt: Date;
}

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


export interface GetUserByIdResponse {
  id: number;
  username: string | null;
  email: string;
  role: 'ADMIN' | 'USER' | 'TECHNICIAN' | 'MANAGER' | 'FLEET_MANAGER' | 'ANALYST' | 'SUPPORT_AGENT';
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'DEACTIVATED';
  phoneNumber: string | null;
  location: string | null;
  companyName: string | null;
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

  vehicles: {
    id: number;
    plateNumber: string;
    vehicleModel: string;
    status: string;
    emissionStatus: string;
    deletedAt: Date | null;
  }[];

  trackingDevices: {
    id: number;
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  }[];

  alerts: {
    id: number;
    type: string;
    title: string;
    isRead: boolean;
    createdAt: Date;
  }[];

  reports: {
    id: number;
    title: string;
    type: string;
    status: string | null;
    createdAt: Date;
  }[];

  activityLogs: {
    id: number;
    action: string;
    timestamp: Date;
  }[];

  userNotifications: {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
  }[];
}


export interface UserDetailResponse {
  id: number;
  username?: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  companyName?: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;

  counts: {
    vehicles: number;
    trackingDevices: number;
    alerts: number;
    reports: number;
    activityLogs: number;
    userNotifications: number;
  };

  vehiclesPreview: {
    id: number;
    plateNumber: string;
    vehicleModel: string;
    status: string;
    emissionStatus: string;
    deletedAt: Date | null;
  }[];

  trackingDevicesPreview: {
    id: number;
    serialNumber: string;
    model: string;
    deviceCategory: string;
    status: string;
  }[];

  alertsPreview: {
    id: number;
    type: string;
    title: string;
    isRead: boolean;
    createdAt: Date;
  }[];

  reportsPreview: {
    id: number;
    title: string;
    type: string;
    status?: string;
    createdAt: Date;
  }[];

  activityLogsPreview: {
    id: number;
    action: string;
    timestamp: Date;
  }[];

  userNotificationsPreview: {
    id: number;
    title: string;
    message: string;
    isRead: boolean;
  }[];
}
export interface UserSummaryResponse {
  id: number;
  username?: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'TECHNICIAN' | 'MANAGER' | 'FLEET_MANAGER' | 'ANALYST' | 'SUPPORT_AGENT';
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'DEACTIVATED';
  createdAt: Date;
}

export interface UserListItemWithCounts {
  id: number;
  username: string | null;
  email: string;
  image: string | null;
  gender: string | null;
  phoneNumber: string | null;
  location: string | null;
  companyName: string | null;
  businessSector: string | null;
  fleetSize: number | null;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
  language: string | null;
  notificationPreference: string;

  _count: {
    vehicles: number;
    trackingDevices: number;
    alerts: number;
    reports: number;
    activityLogs: number;
    userNotifications: number;
  };
}
export interface InternalUser extends GetUserByIdResponse {
  password: string;
}