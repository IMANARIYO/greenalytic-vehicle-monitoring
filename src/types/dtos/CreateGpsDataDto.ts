export interface CreateGpsDataDto {
  vehicleId: number;
  latitude: number;
  longitude: number;
  speed: number;
  trackingDeviceId?: number;
}
