import { supabase } from "./client";


export async function getSubmissionStorageData(submissionId: string) {
  try {
        const { data, error } = await supabase.storage
        .from("submission-photos")
        .list(submissionId);

    if (error) {
      console.error("Error fetching submission storage data:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionStorageData:", error)
    return []
  }
}

export async function getSubmissionPhotos(submissionId: string) {
  try {
     const { data, error } = await supabase
          .from("submission_photos")
          .select("photo_url")
          .eq("submission_id", submissionId);

    if (error) {
      console.error("Error fetching submission photos:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSubmissionPhotos:", error)
    return []
  }
}