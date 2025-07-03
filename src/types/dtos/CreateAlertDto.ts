export interface CreateAlertDto {
  vehicleId: number;
  title: string;
  message: string;
  type: string;
  userId?: number;
}
