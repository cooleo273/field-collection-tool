import ProjectController from "@/lib/controllers/project.controller";
import { NextRequest } from "next/server";

const projectController = new ProjectController();

export async function GET(req: NextRequest, { params }: { params: { adminId: string } }) {
  const { adminId } = await params;
  return projectController.getAdminProjects(req, adminId);
}

export async function POST(req: NextRequest, { params }: { params: { adminId: string } }) {
  const { adminId } = await params;
  return projectController.assignProjectsToAdmin(req, adminId);
}