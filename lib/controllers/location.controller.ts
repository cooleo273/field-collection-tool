import { NextRequest, NextResponse } from "next/server";
import LocationService from "../services/locations.service";

export default class LocationController {
  private locationService: LocationService;

  constructor() {
    this.locationService = new LocationService();
  }

  async getLocations(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.locationService.getLocations();
    });
  }

  async getLocationById(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      return this.locationService.getLocationById(id);
    });
  }

  async getLocationsByType(req: NextRequest, type: "kebele" | "district" | "zone" | "region") {
    return this.handleRequest(req, async () => {
      return this.locationService.getLocationsByType(type);
    });
  }

  async getLocationsByCampaign(req: NextRequest, campaignId: string) {
    return this.handleRequest(req, async () => {
      return this.locationService.getLocationsByCampaign(campaignId);
    });
  }

  async createLocation(req: NextRequest, location: any) {
    return this.handleRequest(req, async () => {
      return this.locationService.createLocation(location);
    });
  }

  async updateLocation(req: NextRequest, id: string, location: any) {
    return this.handleRequest(req, async () => {
      return this.locationService.updateLocation(id, location);
    });
  }

  async deleteLocation(req: NextRequest, id: string) {
    return this.handleRequest(req, async () => {
      return this.locationService.deleteLocation(id);
    });
  }

  async getLocationCount(req: NextRequest) {
    return this.handleRequest(req, async () => {
      return this.locationService.getLocationCount();
    });
  }

  async getPromoterLocations(req: NextRequest, promoterId: string) {
    return this.handleRequest(req, async () => {
      return this.locationService.getPromoterLocations(promoterId);
    });
  }

  async addLocationToCampaign(req: NextRequest, campaignId: string, locationId: string) {
    return this.handleRequest(req, async () => {
      return this.locationService.addLocationToCampaign(campaignId, locationId);
    });
  }
  private async handleRequest(
    req: NextRequest,
    handler: () => Promise<any>
  ): Promise<NextResponse> {
    try {
      const data = await handler();
      return NextResponse.json(data);
    } catch (error) {
      console.error("Error in LocationController:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An error occurred" },
        { status: 500 }
      );
    }
  }
}