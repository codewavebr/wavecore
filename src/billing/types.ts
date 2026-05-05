export type WaveBillingCycle = "monthly" | "yearly";
export type WaveBillingInterval = "month" | "year";

export type WavePlan = {
  id?: string;
  name: string;
  description?: string;
  price: number;
  billingCycle?: WaveBillingCycle;
  maxUsers?: number;
  maxStudents?: number;
  maxClasses?: number;
  features?: string[];
  isActive?: boolean;
  isPopular?: boolean;
  sortOrder?: number;
};

export type WaveLimitCheck = {
  canAdd: boolean;
  current: number;
  limit: number;
  planName: string;
};
