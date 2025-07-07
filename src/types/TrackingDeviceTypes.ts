import { TrackingDevice } from '@prisma/client';

// 🚀 1. CreateTrackingDeviceRequest — input when creating
// ✅ Allow: serialNumber, model, type
// ❌ Omit: anything auto-managed like status, lastPing, etc.
export type CreateTrackingDeviceRequest = Pick<
  TrackingDevice,
  'serialNumber' | 'model' | 'type'
  | 'batteryLevel'
  | 'signalStrength'
  | 'firmwareVersion'
  | 'simCardNumber'
  | 'dataTransmissionInterval'
  | 'plateNumber'
  |'deviceCategory'
>;

// 🚀 2. UpdateTrackingDeviceRequest — input when updating
// ✅ Allow optional updates to: serialNumber, model, type, status, communicationProtocol, isActive
export type UpdateTrackingDeviceRequest = Partial<Omit<
  TrackingDevice,
  | 'id'
  | 'plateNumber'
  | 'deviceCategory'
  | 'status'
  | 'lastPing'
  | 'userId'
  | 'vehicleId'
  | 'gpsData'
  | 'fuelData'
  | 'emissionData'
  | 'obdData'
  | 'deviceHeartbeats'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
>>;


// 🚀 3. TrackingDeviceListItem — shallow list view
export type TrackingDeviceListItem = Pick<
  TrackingDevice,
  'id' | 'serialNumber' | 'model' | 'type' | 'status' | 'isActive' | 'vehicleId' | 'userId'
>;

// 🚀 4. TrackingDeviceFullDetails — full detail view
// This one is manual because it includes nested vehicle/user data
export interface TrackingDeviceFullDetails extends Omit<TrackingDevice, 'vehicleId' | 'userId'> {
  vehicle: {
    id: number;
    plateNumber: string;
  };
  user: {
    id: number;
    fullName: string;
    email: string;
  };
}
