// Enum for solution types
import { SolutionType } from '@prisma/client';

// DTO for creating new solution
export interface CreateSolutionDTO {
  title: string;
  subtitle: string;
  description: string;
  content: string;
  icon: string;
  type: SolutionType;
}

// DTO for updating solution
export interface UpdateSolutionDTO {
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string;
  icon?: string;
  type?: SolutionType;
}

// DTO for querying solutions with filters and pagination
export interface SolutionQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in title, subtitle, or description
  type?: SolutionType; // Filter by solution type
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for solution data (without testimonials)
export interface SolutionResponseDTO {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  content: string;
  icon: string;
  type: SolutionType;
  createdAt: Date;
  updatedAt: Date;
}

// Response DTO for solution data with testimonials included
export interface SolutionWithTestimonialsResponseDTO {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  content: string;
  icon: string;
  type: SolutionType;
  testimonials: {
    id: number;
    name: string;
    position: string;
    company: string;
    content: string;
    icon: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// DTO for solution list response with pagination
export interface SolutionListResponseDTO {
  data: SolutionResponseDTO[];
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
  };
}

// DTO for solution list response with testimonials
export interface SolutionWithTestimonialsListResponseDTO {
  data: SolutionWithTestimonialsResponseDTO[];
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
  };
}

// DTO for creating solution response
export interface CreateSolutionResponseDTO {
  message: string;
  data: SolutionResponseDTO;
}