// DTO for creating new product
export interface CreateProductDTO {
  name: string;
  description: string;
  content: string;
  icon: string;
  iconBackgroundColor: string;
}

// DTO for updating product
export interface UpdateProductDTO {
  name?: string;
  description?: string;
  content?: string;
  icon?: string;
  iconBackgroundColor?: string;
}

// DTO for querying products with filters and pagination
export interface ProductQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name, description
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for product data (without features)
export interface ProductResponseDTO {
  id: number;
  name: string;
  description: string;
  content: string;
  icon: string;
  iconBackgroundColor: string;
  createdAt: Date;
  updatedAt: Date;
}

// Response DTO for product data with features included
export interface ProductWithFeaturesResponseDTO {
  id: number;
  name: string;
  description: string;
  content: string;
  icon: string;
  iconBackgroundColor: string;
  features: {
    id: number;
    title: string;
    description: string;
    icon: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// DTO for product list response with pagination
export interface ProductListResponseDTO {
  data: ProductResponseDTO[];
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

// DTO for creating product response
export interface CreateProductResponseDTO {
  message: string;
  data: ProductResponseDTO;
}