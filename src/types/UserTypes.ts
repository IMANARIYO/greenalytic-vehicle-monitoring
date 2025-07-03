export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIAN' | 'FLEET_MANAGER';
  createdAt: Date;
}


interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
}

interface UserResponse {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}