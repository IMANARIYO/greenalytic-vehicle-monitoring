export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'FLEET_MANAGER';
  createdAt: Date;
}
