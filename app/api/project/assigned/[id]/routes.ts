import ProjectController from "@/lib/controllers/project.controller";
import { NextRequest } from "next/server";

const projectController = new ProjectController();

export async function GET(req: NextRequest, {params}: {params: {id: string}}) {
const {id} = await params// Extract the ID from the request parameters
return projectController.getAssignedProjects(req, id); // Pass the ID to the controller method
}
