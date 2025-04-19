// app/api/users/count/route.ts
import UserController from "@/lib/controllers/user.controller";
import { NextRequest } from "next/server";

const userController = new UserController();

export async function GET(req: NextRequest) {
  return userController.getUserCount(req);
}
    