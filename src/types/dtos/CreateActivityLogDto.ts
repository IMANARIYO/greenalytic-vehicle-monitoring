export interface CreateActivityLogDto {
  userId: number;
  action: string;
  metadata?: any;
}
