import { supabase } from "./client"
import type { RealtimeChannel } from "@supabase/supabase-js"

/**
 * Subscribe to submissions table changes
 */
export function subscribeToSubmissions(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel("submissions-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "submissions",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to users table changes
 */
export function subscribeToUsers(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel("users-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "users",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to campaigns table changes
 */
export function subscribeToCampaigns(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel("campaigns-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "campaigns",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to locations table changes
 */
export function subscribeToLocations(callback: () => void): RealtimeChannel {
  const channel = supabase
    .channel("locations-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "locations",
      },
      () => {
        callback()
      },
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel)
}

