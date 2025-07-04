export interface PaginationMeta {
  page: number;        // current page number
  limit: number;       // items per page
  totalItems: number;  // total number of items matching the query
  totalPages: number;  // total number of pages
  hasNextPage: boolean; // true if there's a next page
  hasPrevPage: boolean; // true if there's a previous page
}
export interface PaginationParams {
  page?: number;
  limit?: number;
}
