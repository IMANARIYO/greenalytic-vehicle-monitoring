export interface CreateUserDto {
  email: string;
  password: string;
  username?: string;
  phoneNumber?: string;
  role?: 'ADMIN' | 'USER' | 'TECHNICIAN' | 'MANAGER' | 'FLEET_MANAGER' | 'ANALYST' | 'SUPPORT_AGENT';
}
