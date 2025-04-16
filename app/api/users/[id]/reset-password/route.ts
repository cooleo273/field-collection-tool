import UserController from "@/lib/controllers/user.controller";
import { NextRequest, NextResponse } from "next/server"


const userController = new UserController();
export async function PUT(req: NextRequest, res: NextResponse) {
    return userController.resetUserPassword(req, res);

}

