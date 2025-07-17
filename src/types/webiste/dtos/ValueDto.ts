// DTO for creating new value
export interface CreateValueDTO {
  title: string;
  description: string;
  icon: string;
}

// DTO for updating value
export interface UpdateValueDTO {
  title?: string;
  description?: string;
  icon?: string;
}

// DTO for querying values with filters and pagination
export interface ValueQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in title or description
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for value data
export interface ValueResponseDTO {
  id: number;
  title: string;
  description: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for value list response with pagination
export interface ValueListResponseDTO {
  data: ValueResponseDTO[];
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

// DTO for creating value response
export interface CreateValueResponseDTO {
  message: string;
  data: ValueResponseDTO;
}