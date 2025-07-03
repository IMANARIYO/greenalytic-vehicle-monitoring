export interface CreateUserNotificationDto {
  userId: number;
  type: 'HIGH_EMISSION_ALERT' | 'DIAGNOSTIC_FAULT_NOTIFICATION' | 'FUEL_ANOMALY_ALERT' | 'DEVICE_OFFLINE_WARNING' | 'SPEED_VIOLATION_ALERT';
  title: string;
  message: string;
}
