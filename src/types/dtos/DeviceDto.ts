// src/types/dtos/DeviceDto.ts
import {
  DeviceStatus,
  DeviceCategory,
  CommunicationProtocol,
} from "@prisma/client";

export interface CreateDeviceDTO {
  serialNumber: string;
  model: string;
  type: string;
  plateNumber: string;
  batteryLevel?: number;
  signalStrength?: number;
  deviceCategory: DeviceCategory;
  firmwareVersion?: string;
  simCardNumber?: string;
  installationDate?: Date;
  communicationProtocol?: CommunicationProtocol;
  dataTransmissionInterval?: string;
  enableOBDMonitoring?: boolean;
  enableGPSTracking?: boolean;
  enableEmissionMonitoring?: boolean;
  enableFuelMonitoring?: boolean;
  isActive?: boolean;
  status?: DeviceStatus;
  userId?: number;
  vehicleId?: number;
}

export interface UpdateDeviceDTO {
  model?: string;
  type?: string;
  plateNumber?: string;
  batteryLevel?: number;
  signalStrength?: number;
  deviceCategory?: DeviceCategory;
  firmwareVersion?: string;
  simCardNumber?: string;
  installationDate?: Date;
  communicationProtocol?: CommunicationProtocol;
  dataTransmissionInterval?: string;
  enableOBDMonitoring?: boolean;
  enableGPSTracking?: boolean;
  enableEmissionMonitoring?: boolean;
  enableFuelMonitoring?: boolean;
  isActive?: boolean;
  status?: DeviceStatus;
}

export interface DeviceAssignmentDTO {
  vehicleId?: number;
  userId?: number;
}

export interface DeviceConfigurationDTO {
  firmwareVersion?: string;
  dataTransmissionInterval?: string;
  enableOBDMonitoring?: boolean;
  enableGPSTracking?: boolean;
  enableEmissionMonitoring?: boolean;
  enableFuelMonitoring?: boolean;
}

export interface DeviceListQueryDTO {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeviceStatus;
  category?: DeviceCategory;
  userId?: number;
  vehicleId?: number;
  isActive?: boolean;
}

export interface DeviceBasicInfo {
  id: number;
  serialNumber: string;
  model: string;
  type: string;
  plateNumber: string;
  batteryLevel?: number;
  signalStrength?: number;
  deviceCategory: DeviceCategory;
  firmwareVersion?: string;
  simCardNumber?: string;
  installationDate?: Date;
  communicationProtocol: CommunicationProtocol;
  dataTransmissionInterval?: string;
  enableOBDMonitoring: boolean;
  enableGPSTracking: boolean;
  enableEmissionMonitoring: boolean;
  enableFuelMonitoring: boolean;
  isActive: boolean;
  status: DeviceStatus;
  lastPing?: Date;
  userId?: number;
  vehicleId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceWithRelations extends DeviceBasicInfo {
  user?: {
    id: number;
    username?: string;
    email: string;
    companyName?: string;
  };
  vehicle?: {
    id: number;
    plateNumber: string;
    vehicleType: string;
    vehicleModel: string;
    status: string;
  };
  _count?: {
    gpsData: number;
    fuelData: number;
    emissionData: number;
    obdData: number;
  };
}

export interface DeviceListResponse {
  devices: DeviceWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DeviceAnalyticsResponse {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  faultyDevices: number;
  devicesByCategory: {
    category: DeviceCategory;
    count: number;
  }[];
  devicesByStatus: {
    status: DeviceStatus;
    count: number;
  }[];
}
