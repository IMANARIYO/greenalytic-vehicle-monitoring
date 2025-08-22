// DTO for creating new blog post
export interface CreateBlogPostDTO {
  title: string;
  slug: string;
  content: string;
  summary: string;
  imageUrl?: string | null;
  authorId: number;
  tags: string[];
  category?: string | null;
}

// DTO for updating blog post
export interface UpdateBlogPostDTO {
  title?: string;
  slug?: string;
  content?: string;
  summary?: string;
  imageUrl?: string | null;
  tags?: string[];
  category?: string | null;
}

// DTO for querying blog posts with filters and pagination
export interface BlogPostQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in title, summary, or content
  category?: string; // Filter by category
  tags?: string[]; // Filter by tags
  authorId?: number; // Filter by author
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for blog post data (without author details)
export interface BlogPostResponseDTO {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  imageUrl: string | null;
  authorId: number;
  tags: string[];
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Response DTO for blog post data with author included
export interface BlogPostWithAuthorResponseDTO {
  id: number;
  title: string;
  slug: string;
  content: string;
  summary: string;
  imageUrl: string | null;
  authorId: number;
  author: {
    id: number;
    username: string | null;
    email: string;
    image: string | null;
  };
  tags: string[];
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for blog post list response with pagination
export interface BlogPostListResponseDTO {
  data: BlogPostResponseDTO[];
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

// DTO for blog post list response with author details
export interface BlogPostWithAuthorListResponseDTO {
  data: BlogPostWithAuthorResponseDTO[];
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

// DTO for creating blog post response
export interface CreateBlogPostResponseDTO {
  message: string;
  data: BlogPostResponseDTO;
}

// DTO for blog categories and tags analytics
export interface BlogAnalyticsResponseDTO {
  categories: {
    category: string | null;
    count: number;
  }[];
  tags: {
    tag: string;
    count: number;
  }[];
  totalPosts: number;
}