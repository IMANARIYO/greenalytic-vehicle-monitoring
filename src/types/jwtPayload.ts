// src/types/jwtPayload.ts
export interface JwtPayload {
    id: number;
    email: string;
    username: string;
    role: string; // or enum UserRole if you want
    iat?: number;
    exp?: number;
  }
  