export interface CreateConnectionStateDto {
  vehicleId: number;
  socketId: string;
  status: 'CONNECTED' | 'DISCONNECTED';
}
