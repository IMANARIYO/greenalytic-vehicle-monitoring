export interface CreateDeviceHeartbeatDto {
  deviceId: number;
  status: 'CONNECTED' | 'DISCONNECTED';
}
