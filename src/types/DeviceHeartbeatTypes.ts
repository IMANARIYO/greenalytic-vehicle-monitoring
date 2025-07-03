export interface DeviceHeartbeat {
  id: string;
  deviceId: string;
  status: 'ACTIVE' | 'INACTIVE';
  timestamp: Date;
}
