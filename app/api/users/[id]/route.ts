import UserController from "@/lib/controllers/user.controller";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const userController = new UserController();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params; // Await params to ensure it's resolved
  const response = await userController.getUserById(id);
  return new Response(JSON.stringify(response.json), { status: response.status });
}

export async function PUT(req: NextRequest, res: NextResponse) {
  return userController.updateUser(req, res);
}
export async function DELETE(req: NextRequest, res: NextResponse) {
  return userController.deleteUser(req, res);
}
