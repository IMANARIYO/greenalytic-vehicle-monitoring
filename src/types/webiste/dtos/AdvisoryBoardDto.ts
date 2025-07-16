// Interface for social links
export interface SocialLinks {
  [key: string]: string | undefined;  // Index signature for Prisma compatibility
  linkedin?: string;
  twitter?: string;
  github?: string;
  email?: string;
  website?: string;
}

// DTO for creating new advisory board member
export interface CreateAdvisoryBoardDTO {
  name: string;
  position: string;
  company: string;
  highlight?: string;
  description: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
  fullBioLink?: string;
}

// DTO for updating advisory board member
export interface UpdateAdvisoryBoardDTO {
  name?: string;
  position?: string;
  company?: string;
  highlight?: string;
  description?: string;
  imageUrl?: string;
  socialLinks?: SocialLinks;
  fullBioLink?: string;
}

// DTO for querying advisory board members with filters and pagination
export interface AdvisoryBoardQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name, position, company, or description
  company?: string;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for advisory board member data
export interface AdvisoryBoardResponseDTO {
  id: number;
  name: string;
  position: string;
  company: string;
  highlight?: string | null;
  description: string;
  imageUrl: string;
  socialLinks?: SocialLinks | null;
  fullBioLink?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for advisory board member list response with pagination
export interface AdvisoryBoardListResponseDTO {
  data: AdvisoryBoardResponseDTO[];
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
      company?: string;
    };
  };
}

// DTO for creating advisory board member response
export interface CreateAdvisoryBoardResponseDTO {
  message: string;
  data: AdvisoryBoardResponseDTO;
}