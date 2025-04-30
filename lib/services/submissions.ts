import { supabase } from "./client";
import type { Database } from "@/types/supabase";

export type SubmissionInsert = Omit<Database['public']['Tables']['submissions']['Insert'], 'id' | 'created_at' | 'updated_at' | 'submitted_at'> & {
  submitted_at?: string; // Allow optional submitted_at override
};
export type Submission = Database['public']['Tables']['submissions']['Row'];
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
/**
 * Create a new submission
 */
export async function createSubmission(submissionData: SubmissionInsert) {
  try {
    console.log("Creating submission with data: ", submissionData); // Keep this log for debugging

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        ...submissionData,
        submitted_at: submissionData.submitted_at || new Date().toISOString(), // Ensure submitted_at is set
      })
      .select() // <-- Make sure this .select() is present
      .single(); // <-- Use .single() if you expect only one row back

    if (error) {
      console.error("Supabase error in createSubmission:", error);
      // Throw the error so the calling function catches it
      throw error;
    }

    // Log the data returned by Supabase (or lack thereof)
    console.log("Data returned from createSubmission insert:", data);

    // Return both data and error (or null for error if successful)
    // The calling function will handle checking if data exists
    return { data: data ? [data] : null, error: null }; // Wrap single result in array for consistency if needed, or adjust caller

  } catch (error: any) {
    console.error("Error caught in createSubmission function:", error);
    // Return the error object so the calling function knows something went wrong
    return { data: null, error };
  }
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

    const { count, error } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true }) // Ensure we are counting the correct field
      .eq("submitted_by", promoterId); // Match the promoter ID with the submitted_by field

    if (error) {
      console.error("Error fetching submission count for promoter ID:", error);
      return 0;
    }


    return count || 0; // Return the count or 0 if no submissions are found
  } catch (error) {
    console.error("Error in getSubmissionCountByPromoterId:", error);
    return 0;
  }
}