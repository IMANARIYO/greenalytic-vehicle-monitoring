// DTO for creating new contact message
export interface CreateContactMessageDTO {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// DTO for updating contact message (admin use)
export interface UpdateContactMessageDTO {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

// DTO for querying contact messages with filters and pagination
export interface ContactMessageQueryDTO {
  // Pagination
  page?: number;
  limit?: number;
  
  // Filtering
  search?: string; // Search in name, email, subject, or message
  email?: string;
  dateFrom?: Date;
  dateTo?: Date;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Response DTO for contact message data
export interface ContactMessageResponseDTO {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

// DTO for contact message list response with pagination
export interface ContactMessageListResponseDTO {
  data: ContactMessageResponseDTO[];
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
      email?: string;
      dateFrom?: Date;
      dateTo?: Date;
    };
  };
}

// DTO for creating contact message response
export interface CreateContactMessageResponseDTO {
  message: string;
  data: ContactMessageResponseDTO;
}