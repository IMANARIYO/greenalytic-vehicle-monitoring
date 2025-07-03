export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  manufacturer?: string;
  year?: number;
  createdAt: Date;
}
