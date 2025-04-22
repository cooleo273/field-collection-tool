// app/api/users/count/route.ts
import { NextRequest, NextResponse } from "next/server";
import UserController from "@/lib/controllers/user.controller";

const userController = new UserController();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");

    if (!role) {
      return NextResponse.json({ error: "Role parameter is required" }, { status: 400 });
    }

    const users = await userController.getUsersByRole(role);
    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/users/byrole:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
