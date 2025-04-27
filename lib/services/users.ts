import { getSupabaseClient, supabase } from "./client"

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
// ... existing code ...

/**
 * Create a user in both Supabase Auth and the users table
 * This ensures users can actually login after being created
 */
export async function createUserWithAuth(userData: {
  name: string;
  email: string;
  role: string;
  status?: string;
  projectId?: string;
}) {
  try {
    // Generate a random password for the new user
    const password = generateRandomPassword(12); // Use the existing helper function

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: password,
      options: {
        // You might want to add email confirmation logic here if needed
        // emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          // Include non-sensitive data you want stored in auth.users.raw_user_meta_data
          name: userData.name,
          role: userData.role,
        }
      }
    });

    if (authError) {
      console.error("Error creating user in Supabase Auth:", authError);
      throw new Error(`Failed to create user authentication: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("User authentication created, but no user data returned.");
    }

    // Now create the user profile in the 'users' table
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id, // Use the ID from the Auth user
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status || 'active', // Default status if not provided
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creating user profile in database:", dbError);
      // Attempt to clean up the Auth user if DB insert fails
      // Note: Supabase Admin client needed for direct user deletion usually.
      // This might require a server-side function call for cleanup.
      // For now, we just log and throw.
      throw new Error(`Failed to create user profile in database: ${dbError.message}`);
    }

    // If this is a promoter and we have project ID, create the association
    if (userData.role === 'promoter' && userData.projectId && dbUser?.id) {
      const { error: projectError } = await supabase
        .from('project_promoters')
        .insert({
          user_id: dbUser.id,
          project_id: userData.projectId
        })
        .select()
        .single();

      if (projectError) {
        console.error('Error creating project promoter association:', projectError);
        // Clean up the created user profile if association fails
        await supabase.from('users').delete().eq('id', dbUser.id);
        // Consider cleaning up the Auth user as well (might need server-side call)
        throw new Error(`Failed to create project promoter association: ${projectError.message}`);
      }
    }

    return {
      user: dbUser,
      password: password // Return the generated password
    };
  } catch (error) {
    console.error("Error in createUserWithAuth:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred while creating user");
  }
}

/**
 * Generate a random password
 */

// ... existing code ...
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
export async function deleteUser(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string) {
  try {
    let query = supabase
      .from("users")
      .select("*")
      .eq("role", role)
      .order("created_at", { ascending: false })
    
    // Add related data based on role
    if (role === 'project-admin') {
      query = supabase
        .from("users")
        .select(`
          *,
          project_admins(
            project_id,
            projects(id, name, status)
          )
        `)
        .eq("role", role)
        .order("created_at", { ascending: false })
    } else if (role === 'promoter') {
      query = supabase
        .from("users")
        .select(`
          *,
          project_promoters(
            project_id,
            projects(id, name)
          ),
          project_promoter_locations(
            location_id,
            project_id
          )
        `)
        .eq("role", role)
        .order("created_at", { ascending: false })
    }

    const { data, error } = await query
    
    if (error) throw error
    
    // Process the data based on role
    let processedData = data
    
    if (role === 'project-admin') {
      processedData = data.map(user => ({
        ...user,
        assigned_projects: user.project_admins?.map((pa: any) => ({
          project_id: pa.project_id,
          project_name: pa.projects?.name,
          project_status: pa.projects?.status
        })) || []
      }))
    } else if (role === 'promoter') {
      processedData = data.map(user => {
        // Group locations by project
        const projectLocations: Record<string, string[]> = {}
        
        if (user.project_promoter_locations) {
          user.project_promoter_locations.forEach((ppl: any) => {
            if (!projectLocations[ppl.project_id]) {
              projectLocations[ppl.project_id] = []
            }
            projectLocations[ppl.project_id].push(ppl.location_id)
          })
        }
        
        return {
          ...user,
          assigned_projects: user.project_promoters?.map((pp: any) => ({
            project_id: pp.project_id,
            project_name: pp.projects?.name,
            assigned_locations: projectLocations[pp.project_id] || []
          })) || [],
          // For backward compatibility
          assignedLocations: user.project_promoter_locations?.map((ppl: any) => ppl.location_id) || []
        }
      })
    }
    
    return processedData
  } catch (error) {
    console.error(`Error getting users by role ${role}:`, error)
    throw error
  }
}

/**
 * Assign projects to a project admin
 */
export async function assignProjectsToAdmin(adminId: string, projectIds: string[]) {
  try {
    // First, delete all existing assignments for this admin
    const { error: deleteError } = await supabase
      .from('project_admins')
      .delete()
      .eq('user_id', adminId)
    
    if (deleteError) throw deleteError
    
    // If there are no projects to assign, we're done
    if (projectIds.length === 0) return
    
    // Create new assignments
    const assignments = projectIds.map(projectId => ({
      project_id: projectId,
      user_id: adminId
    }))
    
    const { error: insertError } = await supabase
      .from('project_admins')
      .insert(assignments)
    
    if (insertError) throw insertError
    
    return true
  } catch (error) {
    console.error('Error assigning projects to admin:', error)
    throw error
  }
}

/**
 * Get projects assigned to an admin
 */
export async function getAdminProjects(adminId: string) {
  try {
    const { data, error } = await supabase
      .from('project_admins')
      .select(`
        project_id,
        projects(id, name, status)
      `)
      .eq('user_id', adminId)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting admin projects:', error)
    throw error
  }
}

/**
 * Assign locations to a promoter for a specific project
 */
export async function assignLocationsToPromoter(userId: string, projectId: string, locationIds: string[]) {
  try {
    // First, ensure the user is assigned to the project
    const { data: existingAssignment, error: checkError } = await supabase
      .from('project_promoters')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError
    }
    
    // If not assigned to project, create the assignment
    if (!existingAssignment) {
      const { error: assignError } = await supabase
        .from('project_promoters')
        .insert({ user_id: userId, project_id: projectId })
      
      if (assignError) throw assignError
    }
    
    // Delete existing location assignments for this project
    const { error: deleteError } = await supabase
      .from('project_promoter_locations')
      .delete()
      .eq('user_id', userId)
      .eq('project_id', projectId)
    
    if (deleteError) throw deleteError
    
    // If there are no locations to assign, we're done
    if (locationIds.length === 0) return
    
    // Create new location assignments
    const assignments = locationIds.map(locationId => ({
      user_id: userId,
      project_id: projectId,
      location_id: locationId
    }))
    
    const { error: insertError } = await supabase
      .from('project_promoter_locations')
      .insert(assignments)
    
    if (insertError) throw insertError
    
    return true
  } catch (error) {
    console.error('Error assigning locations to promoter:', error)
    throw error
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


interface PromoterWithProjectData {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  assignedLocations: Array<{ location_id: string }>;
  submissions: Array<{ id: string }>;
}

export async function getProjectPromoters(projectId: string) {
  try {
    const { data, error } = await supabase
      .from('project_promoters')
      .select(`
        user_id,
        users (
          id,
          name,
          email,
          status,
          role
        ),
        project_promoter_locations!left (
          location_id
        )
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error("Error fetching project promoters:", error);
      throw error;
    }

    // Transform the data to match the expected format
    return data?.map(item => ({
      id: item.user_id, // Use user_id as the id
      name: item.users?.name,
      email: item.users?.email,
      status: item.users?.status,
      role: item.users?.role,
      assignedLocations: item.project_promoter_locations || [],
      submissions: [] // Return empty array for submissions since it's not available
    })) || [];
  } catch (error) {
    console.error("Error in getProjectPromoters:", error);
    throw error;
  }
}

