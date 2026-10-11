export interface Vehicle {
  id: number;
  customerId: number;
  customerName: string;
  registrationNumber: string;
  make: string;
  model: string;
  manufactureYear: number;
  createdAt: string;
}

export interface VehicleCreateRequest {
  customerId: number;
  registrationNumber: string;
  make: string;
  model: string;
  manufactureYear: number;
}
