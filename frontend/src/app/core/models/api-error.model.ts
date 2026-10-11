export interface ApiErrorResponse {
  status: number;
  message: string;
  details: string[];
  timestamp?: string;
}
