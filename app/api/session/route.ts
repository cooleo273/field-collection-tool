import AuthController from "@/lib/controllers/auth.controller";
import { NextRequest } from "next/server";

const authController = new AuthController();

export async function GET(req: NextRequest) {
return authController.getSession(req); // Pass the ID to the controller method
}
