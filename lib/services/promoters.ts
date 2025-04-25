import { supabase } from "./client";

export async function getPromoterById(promoterId: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", promoterId)
      .single();

    if (error) {
      console.error("Error fetching promoter by ID:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getPromoterById:", error);
    throw error;
  }
}