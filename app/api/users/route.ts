import UserController from "@/lib/controllers/user.controller";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"


const userController = new UserController();
export async function GET(req: NextRequest, { params }: { params: { count?: boolean } }) {
  const { count } = params;

  if (count) {
    return userController.getUserCount(req);
  }

  // Handle other GET requests if needed
  return new Response("Invalid request", { status: 400 });
}

export async function POST(req: NextRequest, res: NextResponse) {
  return userController.createUser(req, res);
}

export async function PUT(req: NextRequest, res: NextResponse) {
  return userController.updateUser(req, res);
}
export async function DELETE(req: NextRequest, res: NextResponse) {
  return userController.deleteUser(req, res);
}
