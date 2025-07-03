export interface CreateMaintenanceRecordDto {
  vehicleId: number;
  type: string;
  description: string;
  recommendedAction?: string;
  cost?: number;
  performedAt: Date;
  nextDueDate?: Date;
}
