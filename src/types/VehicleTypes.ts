import {
  FuelType,
  VehicleStatus,
  EmissionStatus,
  DeviceStatus,
  CommunicationProtocol,
  ConnectionStatus,
} from '@prisma/client';

export interface VehicleListItem {
  id: number;
  plateNumber: string;
  vehicleModel: string;
  yearOfManufacture: number;
  fuelType: FuelType | null;
  status: VehicleStatus;
  emissionStatus: EmissionStatus;
  lastMaintenanceDate: Date | null;
  userId: number;
}

export interface VehicleCreateRequest {
  plateNumber: string;
  registrationNumber?: string;
  chassisNumber?: string;
  vehicleType: string;
  vehicleModel: string;
  yearOfManufacture: number;
  usage: string;
  fuelType?: FuelType;
  lastMaintenanceDate?: string | Date;
  userId: number;
}

export interface VehicleUpdateRequest {
  registrationNumber?: string;
  chassisNumber?: string;
  vehicleType?: string;
  vehicleModel?: string;
  usage?: string;
  fuelType?: FuelType;
  status?: VehicleStatus;
  emissionStatus?: EmissionStatus;
  lastMaintenanceDate?: string | Date;
  userId?: number;
}

export interface VehicleFullDetails {
  id: number;
  plateNumber: string;
  registrationNumber?: string;
  chassisNumber?: string;
  vehicleType: string;
  vehicleModel: string;
  yearOfManufacture: number;
  usage: string;
  fuelType: FuelType | null;
  status: VehicleStatus;
  emissionStatus: EmissionStatus;
  lastMaintenanceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  user: {
    id: number;
    username?: string;
    email: string;
    role: string;
  };

  trackingDevices: {
    id: number;
    serialNumber: string;
    status: DeviceStatus;
    firmwareVersion?: string;
    communicationProtocol: CommunicationProtocol;
  }[];

  emissionData: {
    id: number;
    timestamp: Date;
    co2Percentage: number;
    noxPPM?: number;
    pm25Level?: number;
  }[];

  gpsData: {
    id: number;
    timestamp: Date;
    latitude: number;
    longitude: number;
    speed: number;
    accuracy?: number;
  }[];

  fuelData: {
    id: number;
    timestamp: Date;
    fuelLevel: number;
    fuelConsumption: number;
  }[];

  obdData: {
    id: number;
    timestamp: Date;
    faultCodes: string[];
    rpm?: number;
    engineTemperature?: number;
  }[];

  alerts: {
    id: number;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  }[];

  maintenanceRecords: {
    id: number;
    type: string;
    description?: string;
    performedAt: Date;
    nextDueDate?: Date;
    recommendedAction?: string;
  }[];

  connectionState?: {
    status: ConnectionStatus;
    socketId: string;
    lastUpdated: Date;
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: keyof VehicleListItem;
  sortOrder?: 'asc' | 'desc';
  filter?: {
    status?: VehicleStatus;
    emissionStatus?: EmissionStatus;
    vehicleType?: string;
    userId?: number;
  };
}

export interface PaginatedVehicleList {
  data: VehicleListItem[];
  total: number;
  page: number;
  limit: number;
}
