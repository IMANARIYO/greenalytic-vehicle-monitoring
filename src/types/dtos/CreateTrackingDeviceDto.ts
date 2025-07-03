export interface CreateTrackingDeviceDto {
  serialNumber: string;
  model: string;
  type: string;
  plateNumber: string;
  deviceCategory: 'MOTORCYCLE' | 'CAR' | 'TRUCK' | 'TRICYCLE' | 'OTHER';
}
