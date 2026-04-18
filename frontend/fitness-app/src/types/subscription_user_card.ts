export interface SubscriptionUserCardIn {
  card_id: number;
  subscription_id: number;
  init_date: string;      // YYYY-MM-DD
  expiry_date: string;    // YYYY-MM-DD
  automatic_renewal: boolean;
}

export interface SubscriptionUserCardOut {
  id: number;
  card_id: number;
  subscription_id: number;
  init_date: string;
  expiry_date: string;
  automatic_renewal: boolean;
}