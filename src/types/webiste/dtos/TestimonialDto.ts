// DTO for creating new testimonial
export interface CreateTestimonialDTO {
  name: string;
  position: string;
  company: string;
  content: string;
  imageUrl?: string;
  solutionId: number;
}

// DTO for updating testimonial
export interface UpdateTestimonialDTO {
  name?: string;
  position?: string;
  company?: string;
  content?: string;
  imageUrl?: string;
  solutionId?: number;
}

// DTO for querying testimonials with filters and pagination
export interface TestimonialQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name, position, company, or content
  solutionId?: number; // Filter by solution ID
  company?: string; // Filter by company
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for testimonial data (without solution details)
export interface TestimonialResponseDTO {
  id: number;
  name: string;
  position: string;
  company: string;
  content: string;
  imageUrl: string | null;
  solutionId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Response DTO for testimonial data with solution details included
export interface TestimonialWithSolutionResponseDTO {
  id: number;
  name: string;
  position: string;
  company: string;
  content: string;
  imageUrl: string | null;
  solutionId: number;
  usedSolution: {
    id: number;
    title: string;
    subtitle: string;
    type: string;
    imageUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// DTO for testimonial list response with pagination
export interface TestimonialListResponseDTO {
  data: TestimonialResponseDTO[];
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

// DTO for testimonial list response with solution details
export interface TestimonialWithSolutionListResponseDTO {
  data: TestimonialWithSolutionResponseDTO[];
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

// DTO for creating testimonial response
export interface CreateTestimonialResponseDTO {
  message: string;
  data: TestimonialResponseDTO;
}