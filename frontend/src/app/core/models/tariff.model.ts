export interface Tariff {
  id: number;
  productCode: string;
  productName: string;
  baseRatePercentage: number;
  minPremium: number;
  taxPercentage: number;
  standardExcess: number;
  maxLoadingPercentage: number;
  maxDiscountPercentage: number;
  brokerCommissionPercentage: number;
  thirdPartyPropertyLimit?: number;
  active: boolean;
  updatedBy?: string;
  updatedAt?: string;
}
