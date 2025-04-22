import ProjectController from "@/lib/controllers/project.controller";
import { NextRequest } from "next/server";

const projectController = new ProjectController();

export async function GET(req: NextRequest) {
  return projectController.getProjects(req); // Pass the ID to the controller method
}

export async function POST(req: NextRequest) {
  return projectController.createProject(req); // Pass the ID to the controller method
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params; // Extract the ID from the request parameters
  return projectController.updateProject(req, id); // Pass the ID to the controller method
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params; // Extract the ID from the request parameters
  return projectController.deleteProject(req, id); // Pass the ID to the controller method
}

// Removed duplicate GET and POST functions for admin-related operations as they are now in a separate file.
