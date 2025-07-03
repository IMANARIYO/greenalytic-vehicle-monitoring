export interface GpsData {
  id: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  recordedAt: Date;
}
