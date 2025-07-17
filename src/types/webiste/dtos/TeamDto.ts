// Enum for Department
import { Department } from '@prisma/client';
export { Department };

// Interface for social links
export interface SocialLinks {
  [key: string]: string | undefined;  // Add index signature
  linkedin?: string;
  twitter?: string;
  github?: string;
  email?: string;
  website?: string;
}

// DTO for creating new team member
export interface CreateTeamDTO {
  name: string;
  position: string;
  department: Department;
  description: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
  experienceYears?: number;
  location?: string;
  profileUrl?: string;
}

// DTO for updating team member
export interface UpdateTeamDTO {
  name?: string;
  position?: string;
  department?: Department;
  description?: string;
  imageUrl?: string;
  socialLinks?: SocialLinks;
  experienceYears?: number;
  location?: string;
  profileUrl?: string;
}

// DTO for querying team members with filters and pagination
export interface TeamQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name, position, or description
  department?: Department;
  location?: string;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for team member data
export interface TeamResponseDTO {
  id: number;
  name: string;
  position: string;
  department: Department;
  description: string;
  imageUrl: string;
  socialLinks?: SocialLinks | null;
  experienceYears?: number | null;
  location?: string | null;
  profileUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for team member list response with pagination
export interface TeamListResponseDTO {
  data: TeamResponseDTO[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage?: number;
    prevPage?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: {
      department?: Department;
      location?: string;
    };
  };
}

// DTO for creating team member response
export interface CreateTeamResponseDTO {
  message: string;
  data: TeamResponseDTO;
}