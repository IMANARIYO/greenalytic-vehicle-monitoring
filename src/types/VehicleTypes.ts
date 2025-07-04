import {
  FuelType,
  VehicleStatus,
  EmissionStatus,
  DeviceStatus,
  CommunicationProtocol,
  ConnectionStatus,
  Vehicle,
} from '@prisma/client';
import { UserBasicInfo } from './UserTypes';

export interface VehicleListItemWithUser extends Pick<
  Vehicle,
  | 'id'
  | 'plateNumber'
  | 'vehicleModel'
  | 'yearOfManufacture'
  | 'vehicleType'
  | 'usage'
  | 'registrationNumber'
  | 'chassisNumber'
  | 'fuelType'
  | 'status'
  | 'emissionStatus'
  | 'lastMaintenanceDate'
> {
  user: UserBasicInfo;
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

export interface VehicleFullDetails extends Pick<
  Vehicle,
  | 'id'
  | 'plateNumber'
  | 'registrationNumber'
  | 'chassisNumber'
  | 'vehicleType'
  | 'vehicleModel'
  | 'yearOfManufacture'
  | 'usage'
  | 'fuelType'
  | 'status'
  | 'emissionStatus'
  | 'lastMaintenanceDate'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
> {
  user: UserBasicInfo;

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
