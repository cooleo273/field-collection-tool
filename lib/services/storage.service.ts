import { supabase } from "./client"

const BUCKET_NAME = "submission-photos"

export async function deleteImage(url: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    const filePath = url.split(`${BUCKET_NAME}/`)[1]
    if (!filePath) {
      throw new Error("Invalid image URL")
    }

    // Delete the file
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (error) {
      console.error("Error deleting image:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteImage:", error)
    throw error
  }
}



export function getPublicUrl(path: string): string {
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)
  return publicUrl
} 


export async function uploadImage(file: File, submissionId: string): Promise<string> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${submissionId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file)

    if (uploadError) {
      console.error("Error uploading image:", uploadError)
      throw new Error(uploadError.message || "Failed to upload image")
    }

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("Error in uploadImage:", error)
    throw error instanceof Error ? error : new Error("Failed to upload image")
  }
}