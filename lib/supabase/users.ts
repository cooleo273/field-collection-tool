import { supabase } from "./client"
import type { Database } from "@/types/supabase"

export type User = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  status: string
  created_at: string
  updated_at: string
  assignedLocations?: string[]
}

type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>> & {
  assignedLocations?: string[]
}

/**
 * Get all users from the database
 */
export async function getUsers() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        *,
        promoter_locations (
          location_id
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return []
    }

    // Transform the data to include assignedLocations as an array of location IDs
    return (data as any[]).map(user => ({
      ...user,
      assignedLocations: user.promoter_locations?.map((pl: { location_id: string }) => pl.location_id) || []
    }))
  } catch (error) {
    console.error("Error in getUsers:", error)
    return []
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      console.error("Error fetching user by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserById:", error)
    return null
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error) {
      console.error("Error fetching user by email:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserByEmail:", error)
    return null
  }
}

/**
 * Create a user in both Supabase Auth and the users table
 * This ensures users can actually login after being created
 */
export async function createUserWithAuth(userData: { 
  name: string; 
  email: string; 
  role: string; 
  status?: string;
}) {
  try {
    // Call the server-side API endpoint to create the user
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create user");
    }

    return {
      user: data.user,
      password: data.password
    };
  } catch (error) {
    console.error("Error in createUserWithAuth:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred while creating user");
  }
}

/**
 * Generate a random password
 */
function generateRandomPassword(length: number): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * Update a user
 */
export async function updateUser(id: string, data: UserUpdate) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .update({
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone,
        status: data.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Handle location assignments separately using the promoter_locations table
    if (data.assignedLocations) {
      // First, delete existing location assignments
      const { error: deleteError } = await supabase
        .from('promoter_locations')
        .delete()
        .eq('user_id', id)

      if (deleteError) throw deleteError

      // Then, insert new location assignments
      const locationAssignments = data.assignedLocations.map((locationId: string) => ({
        user_id: id,
        location_id: locationId
      }))

      const { error: insertError } = await supabase
        .from('promoter_locations')
        .insert(locationAssignments)

      if (insertError) throw insertError
    }

    return user
  } catch (error) {
    console.error('Error in updateUser:', error)
    throw error
  }
}

/**
 * Delete a user
 * This will delete the user from both the database and Supabase auth
 */
export async function deleteUser(id: string) {
  try {
    // Call the server-side API endpoint to delete the user
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete user");
    }

    return true;
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred while deleting user");
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users by role:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUsersByRole:", error)
    return []
  }
}

/**
 * Get user count
 */
export async function getUserCount() {
  try {
    const { count, error } = await supabase.from("users").select("*", { count: "exact", head: true })

    if (error) {
      console.error("Error getting user count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getUserCount:", error)
    return 0
  }
}

/**
 * Reset a user's password
 * This will send a password reset email to the user
 */
export async function resetUserPassword(id: string) {
  try {
    // Call the server-side API endpoint to reset the password
    const response = await fetch(`/api/users/${id}/reset-password`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reset password");
    }

    return data.message;
  } catch (error) {
    console.error("Error in resetUserPassword:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred while resetting password");
  }
}

/**
 * Create a user
 */
export async function createUser(user: {
  name: string
  email: string
  role: string
  status?: string
}) {
  try {
    const { data, error } = await supabase
      .from("users")
      .insert(user)
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in createUser:", error)
    throw error
  }
}

