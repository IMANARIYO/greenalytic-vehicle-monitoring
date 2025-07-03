export interface UpdateVehicleDto {
  plateNumber?: string;
  vehicleType?: string;
  vehicleModel?: string;
  yearOfManufacture?: number;
  usage?: string;
  fuelType?: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID';
  status?: string;
  emissionStatus?: string;
}
