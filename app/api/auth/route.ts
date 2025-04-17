import { NextRequest, NextResponse } from "next/server";
import AuthController from "../../../lib/controllers/auth.controller";

const authController = new AuthController();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const { email, password } = body;
    return authController.signIn(req, email, password);
  } catch (error) {
    console.error("Error in signIn route:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign-in." },
      { status: 500 }
    );
  }
}