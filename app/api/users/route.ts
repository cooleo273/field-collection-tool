import UserController from "@/lib/controllers/user.controller";
import { NextRequest, NextResponse } from "next/server"


const userController = new UserController();
export async function GET(req: NextRequest) {
 return userController.getAllUsers(req);
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
