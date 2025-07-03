export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  category?: string;
  lastUpdated: Date;
}
