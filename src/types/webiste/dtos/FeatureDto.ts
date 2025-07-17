// DTO for creating new feature
export interface CreateFeatureDTO {
  title: string;
  description: string;
  icon: string;
  productId: number;
}

// DTO for updating feature
export interface UpdateFeatureDTO {
  title?: string;
  description?: string;
  icon?: string;
  productId?: number;
}

// DTO for querying features with filters and pagination
export interface FeatureQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in title or description
  productId?: number; // Filter by product ID
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for feature data (without product details)
export interface FeatureResponseDTO {
  id: number;
  title: string;
  description: string;
  icon: string;
  productId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Response DTO for feature data with product details included
export interface FeatureWithProductResponseDTO {
  id: number;
  title: string;
  description: string;
  icon: string;
  productId: number;
  product: {
    id: number;
    name: string;
    description: string;
    category: string;
    imageUrl: string;
    iconBackgroundColor: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// DTO for feature list response with pagination
export interface FeatureListResponseDTO {
  data: FeatureResponseDTO[];
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

// DTO for feature list response with product details
export interface FeatureWithProductListResponseDTO {
  data: FeatureWithProductResponseDTO[];
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

// DTO for creating feature response
export interface CreateFeatureResponseDTO {
  message: string;
  data: FeatureResponseDTO;
}