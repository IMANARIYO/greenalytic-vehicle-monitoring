export interface Alert {
  id: string;
  vehicleId: string;
  type: string;
  message: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
}
