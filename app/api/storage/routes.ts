import StorageController from "@/lib/controllers/storage.controller";
import { NextRequest } from "next/server";

const storageController = new StorageController();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Extract the ID from the request parameters

  if (!id) {
    return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: "File is required" }), { status: 400 });
  }

  return storageController.uploadImage(req, id, file); // Pass the ID and file to the controller method
}

export async function DELETE(req: NextRequest, { params }: { params: { url: string } }) { 
  const { url } = params; // Extract the URL from the request parameters

  if (!url) {
    return new Response(JSON.stringify({ error: "URL is required" }), { status: 400 });
  }

  return storageController.deleteImage(req, url); // Pass the URL to the controller method
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params; // Extract the ID from the request parameters

  if (!id) {
    return new Response(JSON.stringify({ error: "ID is required" }), { status: 400 });
  }

  return storageController.getPublicUrl(req, id); // Pass the ID to the controller method
}