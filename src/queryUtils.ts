// src/utils/queryUtils.ts

export function sanitizeFilters<T extends Record<string, any>>(filters: T): Partial<T> {
  const result: Partial<T> = {};
console.log("from filters i received   the ",filters)
  for (const key in filters) {
    let value = filters[key];

    if (typeof value === 'string') {
      value = value.trim();
      if (value === '' || value === 'all') continue;
    }

    const match = key.match(/^filters\[(.+)\]$/);
    if (match) {
      const cleanKey = match[1];
      result[cleanKey as keyof T] = value;
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}
