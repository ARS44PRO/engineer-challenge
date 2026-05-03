export interface RegisterArgs {
  input: {
    email: string;
    password: string;
    passwordConfirmation: string;
  };
}

export interface LoginArgs {
  input: {
    email: string;
    password: string;
  };
}

export interface RequestPasswordResetArgs {
  email: string;
}

export interface ResetPasswordArgs {
  input: {
    token: string;
    newPassword: string;
    newPasswordConfirmation: string;
  };
}
