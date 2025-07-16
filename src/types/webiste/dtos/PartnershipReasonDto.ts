// DTO for creating new partnership reason
export interface CreatePartnershipReasonDTO {
  title: string;
  description: string;
  icon: string;
}

// DTO for updating partnership reason
export interface UpdatePartnershipReasonDTO {
  title?: string;
  description?: string;
  icon?: string;
}

// DTO for querying partnership reasons with filters and pagination
export interface PartnershipReasonQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in title or description
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for partnership reason data
export interface PartnershipReasonResponseDTO {
  id: number;
  title: string;
  description: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for partnership reason list response with pagination
export interface PartnershipReasonListResponseDTO {
  data: PartnershipReasonResponseDTO[];
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

// DTO for creating partnership reason response
export interface CreatePartnershipReasonResponseDTO {
  message: string;
  data: PartnershipReasonResponseDTO;
}