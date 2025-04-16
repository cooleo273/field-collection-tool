import { NextRequest } from "next/server";
import AuthController from "@/lib/controllers/auth.controller";

const authController = new AuthController();

export async function GET(req: NextRequest) {
  return authController.getSession(req);
}

export async function POST(req: NextRequest) {
  const { action, email, password } = await req.json();

  switch (action) {
    case "signIn":
      return authController.signIn(req, email, password);
    case "signOut":
      return authController.signOut(req);
    case "getCurrentUser":
      return authController.getCurrentUser(req);
    default:
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }
}

