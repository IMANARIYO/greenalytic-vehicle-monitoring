export * from './AlertTypes.js';
export * from './ConnectionStateTypes.js';
export * from './DeviceHeartbeatTypes.js';
export * from './EmissionDataTypes.js';
export * from './FuelDataTypes.js';
export * from './GpsDataTypes.js';
export * from './InventoryItemTypes.js';
export * from './MaintenanceRecordTypes.js';
export * from './OBDDataTypes.js';
export * from './ReportTypes.js';
export * from './ThresholdConfigTypes.js';
export * from './TrackingDeviceTypes.js';
export * from './UserNotificationTypes.js';
export * from './UserTypes.js';
export * from './VehicleTypes.js';

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
  
