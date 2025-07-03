export interface OBDData {
  id: string;
  vehicleId: string;
  code: string;
  description?: string;
  recordedAt: Date;
}
