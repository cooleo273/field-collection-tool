import { NextRequest, NextResponse } from "next/server";
import AuthService from "../services/auth.service";

export default class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async signIn(req: NextRequest, email: string, password: string) {
    return this.handleRequest(req, async () => {
      const result = await this.authService.signIn(email, password);
      return result;
    });
  }
  async signOut(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.authService.signOut();
    });
  }
    async getSession(req: NextRequest){
        return this.handleRequest(req, async () => {
        return this.authService.getSession();
        });
    }
    async getCurrentUser(req: NextRequest) {
        return this.handleRequest(req, async () => {
        return this.authService.getCurrentUser();
        });
    }
  private async handleRequest(
    req: NextRequest,
    handler: () => Promise<any>
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error in ProjectController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}
