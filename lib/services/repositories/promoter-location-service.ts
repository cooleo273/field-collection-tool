import { getSupabaseClient } from "@/lib/services/client";

export async function getLocationForPromoter(userId: string) {
  const supabase = getSupabaseClient();

  try {
    // Fetch the location_id for the given user_id from promoter_location table
    const { data: promoterLocation, error: promoterError } = await supabase
      .from("promoter_locations")
      .select("location_id")
      .eq("user_id", userId)
      .single();

    if (promoterError || !promoterLocation) {
      console.error("Error fetching promoter location:", promoterError);
      return null;
    }

    const locationId = promoterLocation.location_id;

    // Fetch the location details from the locations table using location_id
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .select("*")
      .eq("id", locationId)
      .single();

    if (locationError || !location) {
      console.error("Error fetching location details:", locationError);
      return null;
    }

    return location;
  } catch (error) {
    console.error("Unexpected error fetching location for promoter:", error);
    return null;
  }
}