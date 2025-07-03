export interface CreateReportDto {
  title: string;
  type: string;
  format: string;
  userId: number;
  vehicleIds: number[];
  dateFrom?: Date;
  dateTo?: Date;
}
