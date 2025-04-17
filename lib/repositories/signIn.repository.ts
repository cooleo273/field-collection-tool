import AuthService from "../services/auth.service";

const authService = new AuthService();

export async function signIn(email: string, password: string) {
  return authService.signIn(email, password);
}