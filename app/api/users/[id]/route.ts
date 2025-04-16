import UserController from "@/lib/controllers/user.controller";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"


const userController = new UserController();
function generateRandomPassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+"
  let password = ""
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }
  return password
}

export async function PUT(req: NextRequest, res: NextResponse) {
  return userController.updateUser(req, res);
}
export async function DELETE(req: NextRequest, res: NextResponse) {
  return userController.deleteUser(req, res);
}
