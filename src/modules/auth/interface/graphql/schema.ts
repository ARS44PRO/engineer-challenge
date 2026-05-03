export const authSchema = `
  type User {
    id: ID!
    email: String!
    createdAt: String!
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  type RequestPasswordResetPayload {
    """
    В dev возвращается ссылка для тестирования флоу.
    В production всегда null.
    """
    devResetLink: String
  }

  input RegisterInput {
    email: String!
    password: String!
    passwordConfirmation: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input ResetPasswordInput {
    token: String!
    newPassword: String!
    newPasswordConfirmation: String!
  }

  extend type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    requestPasswordReset(email: String!): RequestPasswordResetPayload!
    resetPassword(input: ResetPasswordInput!): Boolean!
  }
`;
