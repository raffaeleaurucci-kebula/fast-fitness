export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  name: string;
  surname: string;
  date_of_birth: string;       // YYYY-MM-DD
  location_of_birth: string;
  country: string;
  street_address: string;
  street_number: number;
  city: string;
  zip_code: string;
  phone_number: string;
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  role: "USER" | "ADMIN";
}

export interface UserOut {
    id: number;
    name: string;
    surname: string;
    date_of_birth: string;
    location_of_birth: string;
    country: string;
    street_address: string;
    street_number: string;
    city: string;
    zip_code: string;
    phone_number: string;
    username: string;
    email: string;
    role: string;
}