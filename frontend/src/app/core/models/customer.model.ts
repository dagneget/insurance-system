export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  vehicleCount: number;
}

export interface CustomerCreateRequest {
  fullName: string;
  phone: string;
  email?: string;
}
