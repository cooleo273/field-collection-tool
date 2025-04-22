import { NextResponse } from "next/server";
import UserService from "@/lib/services/users.service";

const userService = new UserService();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    console.error("Error in GET /api/users/email:", error);
    return NextResponse.json({ error: "Failed to fetch user by email" }, { status: 500 });
  }
}