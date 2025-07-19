export interface PaginationMeta {
  page: number;        // current page number
  limit: number;       // items per page
  totalItems: number;  // total number of items matching the query
  totalPages: number;  // total number of pages
  hasNextPage: boolean; // true if there's a next page
  hasPrevPage: boolean; // true if there's a previous page
  nextPage?: number;        // optional: next page number
  prevPage?: number;        // optional: previous page number
  sortBy?: string;          // optional: sorting field (e.g., 'createdAt')
  sortOrder?: 'asc' | 'desc'; // optional: sort direction
}
export  interface PaginationParams<T = any>  {
  page?: number;
  limit?: number;
  sortBy?: string;           
  sortOrder?: 'asc' | 'desc';  
  search?: string;              
  filters?: T;
  includeDeleted?: boolean;     
  deletedOnly?: boolean;
  
}
