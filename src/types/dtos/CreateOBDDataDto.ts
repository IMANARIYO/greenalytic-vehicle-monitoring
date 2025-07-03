export interface CreateOBDDataDto {
  vehicleId: number;
  trackingDeviceId: number;
  plateNumber: string;
  throttlePosition: number;
  engineTemperature?: number;
  rpm?: number;
  faultCodes?: string[];
}
