// Offline storage using IndexedDB
import { openDB } from "idb"
import { getSupabaseClient } from "./supabase/client"

// Define database name and version
const DB_NAME = "akofada-bcc-db"
const DB_VERSION = 1

// Initialize the database
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains("submissions")) {
        const submissionsStore = db.createObjectStore("submissions", { keyPath: "id" })
        submissionsStore.createIndex("syncStatus", "syncStatus")
        submissionsStore.createIndex("submittedBy", "submittedBy")
      }

      if (!db.objectStoreNames.contains("participants")) {
        const participantsStore = db.createObjectStore("participants", { keyPath: "id" })
        participantsStore.createIndex("submissionId", "submissionId")
      }

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" })
      }
    },
  })
}

// Save submission to local storage when offline
export async function saveSubmissionOffline(submission: any) {
  try {
    // Get existing offline submissions
    const offlineSubmissions = JSON.parse(localStorage.getItem("offlineSubmissions") || "[]")

    // Add the new submission
    offlineSubmissions.push({
      ...submission,
      syncStatus: "local",
    })

    // Save back to local storage
    localStorage.setItem("offlineSubmissions", JSON.stringify(offlineSubmissions))

    return submission
  } catch (error) {
    console.error("Error saving submission offline:", error)
    throw error
  }
}

// Get all submissions for the current user
export async function getSubmissions(userId: string) {
  const db = await initDB()
  return db.getAllFromIndex("submissions", "submittedBy", userId)
}

// Get submissions that need to be synced
export async function getPendingSubmissions() {
  const db = await initDB()
  return db.getAllFromIndex("submissions", "syncStatus", "local")
}

// Update submission sync status
export async function updateSubmissionSyncStatus(id: string, status: "local" | "synced") {
  const db = await initDB()
  const submission = await db.get("submissions", id)
  if (submission) {
    submission.syncStatus = status
    submission.updatedAt = new Date()
    await db.put("submissions", submission)
  }
  return submission
}

// Save image to IndexedDB
export async function saveImageOffline(id: string, imageData: string) {
  const db = await initDB()
  await db.put("images", { id, data: imageData })
  return id
}

// Get image from IndexedDB
export async function getImageOffline(id: string) {
  const db = await initDB()
  return db.get("images", id)
}

// Delete submission from IndexedDB
export async function deleteSubmission(id: string) {
  const db = await initDB()
  await db.delete("submissions", id)
}

// Sync offline submissions when back online
export async function syncOfflineSubmissions() {
  try {
    // Get offline submissions
    const offlineSubmissions = JSON.parse(localStorage.getItem("offlineSubmissions") || "[]")

    if (offlineSubmissions.length === 0) {
      return { synced: 0, failed: 0 }
    }

    const supabase = getSupabaseClient()
    let synced = 0
    let failed = 0

    // Process each submission
    for (const submission of offlineSubmissions) {
      try {
        // Insert the submission
        const { data, error } = await supabase
          .from("submissions")
          .insert([
            {
              id: submission.id,
              campaign_id: submission.campaignId || null,
              location_id: submission.locationId || null,
              community_group_id: submission.communityGroupId || null,
              community_group_type: submission.communityGroupType,
              participant_count: submission.participantCount,
              key_issues: submission.keyIssues || null,
              status: submission.status || "draft",
              submitted_by: submission.submittedBy || null,
              submitted_at: submission.submittedAt ? new Date(submission.submittedAt).toISOString() : null,
              sync_status: "synced",
              created_at: submission.createdAt
                ? new Date(submission.createdAt).toISOString()
                : new Date().toISOString(),
              updated_at: submission.updatedAt
                ? new Date(submission.updatedAt).toISOString()
                : new Date().toISOString(),
            },
          ])
          .select()

        if (error) {
          console.error("Error syncing submission:", error)
          failed++
          continue
        }

        // If there are photos, add them
        if (submission.photoProof && submission.photoProof.length > 0) {
          const photoInserts = submission.photoProof.map((url: string) => ({
            submission_id: submission.id,
            photo_url: url,
          }))

          const { error: photoError } = await supabase.from("submission_photos").insert(photoInserts)

          if (photoError) {
            console.error("Error adding submission photos during sync:", photoError)
          }
        }

        synced++
      } catch (error) {
        console.error("Error processing offline submission:", error)
        failed++
      }
    }

    // Clear synced submissions
    if (synced > 0) {
      localStorage.setItem(
        "offlineSubmissions",
        JSON.stringify(offlineSubmissions.filter((_: any, i: number) => i >= synced)),
      )
    }

    return { synced, failed }
  } catch (error) {
    console.error("Error syncing offline submissions:", error)
    throw error
  }
}

// Get offline submissions
export function getOfflineSubmissions() {
  try {
    return JSON.parse(localStorage.getItem("offlineSubmissions") || "[]")
  } catch (error) {
    console.error("Error getting offline submissions:", error)
    return []
  }
}

