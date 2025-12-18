// DTO for creating new partner
export interface CreatePartnerDTO {
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl?: string;
  categoryId: number;
  keyImpact?: string;
  logoFile?: File
}

// DTO for updating partner
export interface UpdatePartnerDTO {
  name?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  categoryId?: number;
  keyImpact?: string;
  logoFile?: File
}

// DTO for querying partners with filters and pagination
export interface PartnerQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name, description, or keyImpact
  categoryId?: number;
  categoryName?: string;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Include category details
  includeCategory?: boolean;
}

// Response DTO for partner data
export interface PartnerResponseDTO {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl?: string | null;
  categoryId: number;
  keyImpact?: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Optional category details
  category?: {
    id: number;
    name: string;
    icon: string;
  };
}

// DTO for partner with full category details
export interface PartnerWithCategoryDTO {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  websiteUrl?: string | null;
  categoryId: number;
  keyImpact?: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    icon: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// DTO for partner list response with pagination
export interface PartnerListResponseDTO {
  data: PartnerResponseDTO[];
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
      categoryId?: number;
      categoryName?: string;
    };
  };
}

// DTO for creating partner response
export interface CreatePartnerResponseDTO {
  message: string;
  data: PartnerResponseDTO;
}