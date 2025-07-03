export interface ConnectionState {
  id: string;
  vehicleId: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  socketId?: string;
  lastUpdated: Date;
}
