import { NextRequest, NextResponse } from "next/server";
import AuthController from "../../../lib/controllers/auth.controller";

const authController = new AuthController();

export async function POST(req: NextRequest) {
  const { action, email, password } = await req.json();

  switch (action) {
    case "signIn":
      return authController.signIn(req, email, password);
    case "signOut":
      return authController.signOut(req);
    case "getSession":
      return authController.getSession(req);
    case "getCurrentUser":
      return authController.getCurrentUser(req);
    default:
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
  }
}