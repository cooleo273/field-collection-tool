import { supabase } from "./client";
import type { Database } from "@/types/supabase";

export type Submission = Database["public"]["Tables"]["submissions"]["Row"];
export type SubmissionStatus = "draft" | "submitted" | "approved" | "rejected";
export type SyncStatusType = "local" | "synced";

export async function getSubmissions() {
  const { data, error } = await supabase
    .from("submissions")
    .select(
      `
      *,
      submitted_by:users!submissions_submitted_by_fkey (
        id,
        name,
        email
      ),
      reviewed_by:users!submissions_reviewed_by_fkey (
        id,
        name,
        email
      )
    `
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("Error fetching submissions:", error);
    throw error;
  }

  return data;
}

export async function getSubmissionsByUserId(userId: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        "*, users!submissions_submitted_by_fkey(name, email, role)"
      )
      .eq("submitted_by", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching submissions by user ID:"  , error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getSubmissionsByUserId:", error);
    return [];
  }
}

export async function getSubmissionById(id: string) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching submission by ID:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Submission not found");
    }

    return data;
  } catch (error) {
    console.error("Error in getSubmissionById:", error);
    throw error;
  }
}





export async function deleteSubmission(id: string) {
  try {
    const { error } = await supabase.from("submissions").delete().eq("id", id);

    if (error) {
      console.error("Error deleting submission:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteSubmission:", error);
    return false;
  }
}

export async function getSubmissionCount() {
  try {
    const { count, error } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error fetching submissions count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getSubmissionCount:", error);
    return 0;
  }
}

export async function getRecentSubmissions(limit = 5) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*, users(name, email, role), locations(name), campaigns(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching recent submissions:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getRecentSubmissions:", error);
    return [];
  }
}
export async function createSubmission(
  submission: Omit<
    Database["public"]["Tables"]["submissions"]["Insert"],
    "id" | "created_at" | "updated_at"
  >,
  photoUrls?: string[]
) {
  const { data, error } = await supabase
    .from("submissions")
    .insert([
      {
        ...submission,
        status: "submitted" as SubmissionStatus,
        sync_status: "synced" as SyncStatusType,
        submitted_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error creating submission:", error);
    throw error;
  }

  if (photoUrls && photoUrls.length > 0 && data) {
    const photoEntries = photoUrls.map((url) => ({
      submission_id: data.id,
      photo_url: url,
      created_at: new Date().toISOString(),
    }));

    const { error: photoError } = await supabase
      .from("submission_photos")
      .insert(photoEntries);

    if (photoError) {
      console.error("Error storing submission photos:", photoError);
    }
  }

  return data;
}

export async function updateSubmission(
  id: string,
  submission: Partial<Omit<Submission, "id" | "created_at" | "updated_at">>
) {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .update({
        ...submission,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error updating submission:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error in updateSubmission:", error);
    return null;
  }
}

export async function updateSubmissionStatus(submissionId: string, status: "approved" | "rejected") {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", submissionId)
      .select();

    if (error) {
      console.error("Error updating submission status:", error);
      throw error;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error in updateSubmissionStatus:", error);
    throw error;
  }
}

export async function getSubmissionCountByPromoterId(promoterId: string): Promise<number> {
  try {
    console.log("Fetching submission count for promoter ID:", promoterId); // Debug log

    const { count, error } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true }) // Ensure we are counting the correct field
      .eq("submitted_by", promoterId); // Match the promoter ID with the submitted_by field

    if (error) {
      console.error("Error fetching submission count for promoter ID:", error);
      return 0;
    }

    console.log("Submission count for promoter ID:", promoterId, "is", count); // Debug log

    return count || 0; // Return the count or 0 if no submissions are found
  } catch (error) {
    console.error("Error in getSubmissionCountByPromoterId:", error);
    return 0;
  }
}