export interface DashboardSummary {
  totalPolicies: number;
  activePolicies: number;
  draftPolicies: number;
  expiringPoliciesCount: number;
  expiredPoliciesCount: number;
  renewedPoliciesCount: number;
  totalPremium: number;
  totalPaid: number;
  totalOutstanding: number;
  openClaimsCount: number;
  totalCustomers: number;
  totalVehicles: number;
}
