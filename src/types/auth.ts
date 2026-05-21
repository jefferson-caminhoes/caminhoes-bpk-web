export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
};
