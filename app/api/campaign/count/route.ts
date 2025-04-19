// app/api/users/count/route.ts
import CampaignController from "@/lib/controllers/campaign.controller";
import UserController from "@/lib/controllers/user.controller";
import { NextRequest } from "next/server";

const campaignController = new CampaignController();

export async function GET(req: NextRequest) {
  return campaignController.getCampaignCount(req);
}
    