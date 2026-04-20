export interface CourseUserCardIn {
  card_id: number;
  course_id: number;
  init_date: string;
  expiry_date: string;
  paid_amount: number;
  cancelled: boolean;
}

export interface CourseUserCardOut {
  id: number;
  course_id: number;
  card_id: number;
  init_date: string;
  expiry_date: string;
  paid_amount: number;
  cancelled: boolean;
}