export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_name: string;
  role_display_name: string;
  permissions: string[];
  is_active: boolean;
  last_login_at: string | null;
}

export interface AuthResponse {
  user: UserProfile;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}
