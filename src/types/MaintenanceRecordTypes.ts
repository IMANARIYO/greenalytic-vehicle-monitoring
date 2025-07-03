export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: string;
  description?: string;
  date: Date;
}
