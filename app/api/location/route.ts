import { NextRequest } from "next/server";
import LocationController from "@/lib/controllers/location.controller";

const locationController = new LocationController();

export async function GET(req: NextRequest, { params }: { params: { id?: string; type?: string; campaignId?: string; count?: boolean } }) {
  const { id, type, campaignId, count } = params;

  if (count) {
    return locationController.getLocationCount(req);
  } else if (id) {
    return locationController.getLocationById(req, id);
  } else if (type) {
    return locationController.getLocationsByType(req, type as "kebele" | "district" | "zone" | "region");
  } else if (campaignId) {
    return locationController.getLocationsByCampaign(req, campaignId);
  } else {
    return locationController.getLocations(req);
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return locationController.createLocation(req, body);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  return locationController.updateLocation(req, id, body);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  return locationController.deleteLocation(req, id);
}

export async function PATCH(req: NextRequest, { params }: { params: { campaignId: string; locationId: string } }) {
  const { campaignId, locationId } = params;
  return locationController.addLocationToCampaign(req, campaignId, locationId);
}