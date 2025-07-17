// DTO for creating new partner category
export interface CreatePartnerCategoryDTO {
  name: string;
  icon: string;
}

// DTO for updating partner category
export interface UpdatePartnerCategoryDTO {
  name?: string;
  icon?: string;
}

// DTO for querying partner categories with filters and pagination
export interface PartnerCategoryQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Include partners count
  includePartnersCount?: boolean;
}

// Response DTO for partner category data
export interface PartnerCategoryResponseDTO {
  id: number;
  name: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  // Optional partner count for list views
  partnersCount?: number;
}

// DTO for partner category with partners
export interface PartnerCategoryWithPartnersDTO {
  id: number;
  name: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  partners: {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    websiteUrl?: string | null;
    keyImpact?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}

// DTO for partner category list response with pagination
export interface PartnerCategoryListResponseDTO {
  data: PartnerCategoryResponseDTO[];
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

// DTO for creating partner category response
export interface CreatePartnerCategoryResponseDTO {
  message: string;
  data: PartnerCategoryResponseDTO;
}