import { NextResponse } from "next/server";
import UserService from "@/lib/services/users.service";
import UserController from "@/lib/controllers/user.controller";

const userController = new UserController();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get("adminId");
  const projectId = searchParams.get("projectId");

  if (!adminId || !projectId) {
    return NextResponse.json({ error: "Admin ID and Project ID are required" })
  }

  try {
    const projectPromoters = await userController.getProjectPromoters(adminId, projectId);
    if (!projectPromoters) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(projectPromoters);
  } catch (error) {
    console.error("Error in GET /api/users/email:", error);
    return NextResponse.json({ error: "Failed to fetch user by email" }, { status: 500 });
  }
}