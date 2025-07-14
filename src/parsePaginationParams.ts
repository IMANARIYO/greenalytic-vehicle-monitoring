import { PaginationParams } from "./types/GlobalTypes";

export function parsePaginationParams(raw: any): PaginationParams {
    return {
      page: parseInt(raw.page) || 1,
      limit: parseInt(raw.limit) || 10,
      sortBy: raw.sortBy || 'createdAt',
      sortOrder: raw.sortOrder === 'asc' ? 'asc' : 'desc',
      search: raw.search || '',
      filters: raw.filters || {},
      includeDeleted: raw.includeDeleted === 'true',
      deletedOnly: raw.deletedOnly === 'true',
    };
  }
  