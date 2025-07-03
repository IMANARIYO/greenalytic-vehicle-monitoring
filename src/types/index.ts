export * from './AlertTypes';
export * from './ConnectionStateTypes';
export * from './DeviceHeartbeatTypes';
export * from './EmissionDataTypes';
export * from './FuelDataTypes';
export * from './GpsDataTypes';
export * from './InventoryItemTypes';
export * from './MaintenanceRecordTypes';
export * from './OBDDataTypes';
export * from './ReportTypes';
export * from './ThresholdConfigTypes';
export * from './TrackingDeviceTypes';
export * from './UserNotificationTypes';
export * from './UserTypes';
export * from './VehicleTypes';

// src/types/prisma-types.ts
import {
    User,
    Vehicle,
    TrackingDevice,
    FuelData,
    EmissionData,
    GpsData,
    OBDData,
    Alert,
    ConnectionState,
    Report,
    MaintenanceRecord,
    ActivityLog,
    InventoryItem,
    ThresholdConfig,
    DeviceHeartbeat,
    UserNotification,
    UserRole,
    ConnectionStatus,
    DeviceStatus,
    VehicleStatus,
    EmissionStatus,
    FuelType,
    DeviceCategory,
    CommunicationProtocol,
    UserStatus,
    NotificationType,
  } from '@prisma/client';
  
  export {
    User,
    Vehicle,
    TrackingDevice,
    FuelData,
    EmissionData,
    GpsData,
    OBDData,
    Alert,
    ConnectionState,
    Report,
    MaintenanceRecord,
    ActivityLog,
    InventoryItem,
    ThresholdConfig,
    DeviceHeartbeat,
    UserNotification,
    // Enums
    UserRole,
    ConnectionStatus,
    DeviceStatus,
    VehicleStatus,
    EmissionStatus,
    FuelType,
    DeviceCategory,
    CommunicationProtocol,
    UserStatus,
    NotificationType,
  };
  
