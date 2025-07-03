export interface UpdateUserDto {
  username?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  role?: 'ADMIN' | 'USER' | 'TECHNICIAN' | 'MANAGER' | 'FLEET_MANAGER' | 'ANALYST' | 'SUPPORT_AGENT';
  status?: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'DEACTIVATED';
}
