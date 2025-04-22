import CampaignController from "@/lib/controllers/campaign.controller";
import { NextRequest } from "next/server";

const campaignController = new CampaignController();

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get("id");

  if (campaignId) {
    return campaignController.getCampaignById(req, campaignId);
  }

  return campaignController.getCampaigns(req);
}

export async function POST(req: NextRequest) {
  const campaign = await req.json();
  return campaignController.createCampaign(req, campaign);
}

export async function PUT(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get("id");

  if (!campaignId) {
    return new Response(JSON.stringify({ error: "Campaign ID is required" }), { status: 400 });
  }

  const campaign = await req.json();
  return campaignController.updateCampaign(req, campaignId, campaign);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignId = searchParams.get("id");

  if (!campaignId) {
    return new Response(JSON.stringify({ error: "Campaign ID is required" }), { status: 400 });
  }

  return campaignController.deleteCampaign(req, campaignId);
}