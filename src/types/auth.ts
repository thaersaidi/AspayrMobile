export interface User {
  userUuid: string;
  username: string;
  email: string;
  displayName?: string;
  provider?: 'email' | 'microsoft' | 'google';
  oid?: string;
}

export interface UserDetails {
  displayName?: string;
  email: string;
  provider?: string;
  oid?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  displayName?: string;
}
