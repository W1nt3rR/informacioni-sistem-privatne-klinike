export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiration: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  userName: string;
  ime: string;
  prezime: string;
  roles: string[];
}

export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}
