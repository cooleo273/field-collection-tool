import { NextRequest, NextResponse } from "next/server";
import CampaignService from "../services/campaigns.service";

export default class CampaignController {
  private campaignService: CampaignService;

  constructor() {
    this.campaignService = new CampaignService();
  }

  async getCampaigns(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.campaignService.getCampaigns();
    });
  }

  async getCampaignById(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      return this.campaignService.getCampaignById(id);
    });
  }

  async createCampaign(req: NextRequest, campaign: any) {
    return this.handleRequest(req, async () => {
      return this.campaignService.createCampaign(campaign);
    });
  }

  async updateCampaign(req: NextRequest, id: string, campaign: any) {
    return this.handleRequest(req, async () => {
      return this.campaignService.updateCampaign(id, campaign);
    });
  }

  async deleteCampaign(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      return this.campaignService.deleteCampaign(id);
    });
  }

  async getAssignedCampaigns(req: NextRequest, userId: string) {
    return this.handleRequest(req, async () => {
      return this.campaignService.getAssignedCampaigns(userId);
    });
  }

  async getCampaignCount(_req: NextRequest): Promise<NextResponse> {
    try {
      const count = await this.campaignService.getCampaignCount();
      return NextResponse.json({ count });
    } catch (error) {
      console.error("Controller Error:", error);
      return NextResponse.json({ error: "Failed to get user count" }, { status: 500 });
    }
  }


  private async handleRequest(
    req: NextRequest,
    handler: () => Promise<any>
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error in CampaignController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}