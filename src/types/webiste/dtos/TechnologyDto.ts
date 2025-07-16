// DTO for creating new technology
export interface CreateTechnologyDTO {
  name: string;
  description: string;
  icon: string;
}

// DTO for updating technology
export interface UpdateTechnologyDTO {
  name?: string;
  description?: string;
  icon?: string;
}

// DTO for querying technologies with filters and pagination
export interface TechnologyQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name or description
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for technology data
export interface TechnologyResponseDTO {
  id: number;
  name: string;
  description: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for technology list response with pagination
export interface TechnologyListResponseDTO {
  data: TechnologyResponseDTO[];
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

// DTO for creating technology response
export interface CreateTechnologyResponseDTO {
  message: string;
  data: TechnologyResponseDTO;
}