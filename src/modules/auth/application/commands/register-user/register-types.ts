export interface RegisterUserResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}
