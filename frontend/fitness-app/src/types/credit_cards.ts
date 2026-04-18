export interface CreditCardIn {
  user_id: number;
  number: string;
  expiry_date: string; // formato MM-YYYY
  brand: string;
}

export interface CreditCardOut {
  id: number;
  user_id: number;
  number: string;
  expiry_date: string;
  brand: string;
}