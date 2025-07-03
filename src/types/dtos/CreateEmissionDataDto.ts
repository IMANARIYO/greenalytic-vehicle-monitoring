export interface CreateEmissionDataDto {
  vehicleId: number;
  trackingDeviceId: number;
  co2Percentage: number;
  coPercentage: number;
  o2Percentage: number;
  hcPPM: number;
  plateNumber?: string;
}
