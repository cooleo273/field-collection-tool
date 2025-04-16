import { getSupabaseClient } from "./client"
import { supabase } from "./client"

export async function getProjectByAdmin(adminId: string) {
  const { data, error } = await supabase
    .from('project_admins')
    .select(`
      projects!inner (
        id,
        name,
        description,
        start_date,
        end_date,
        status,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', adminId)

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  // Return the first project if exists
  return data && data.length > 0 ? data[0].projects : null
}

interface Project {
    id: string
    name: string
    description: string
    start_date: string
    end_date: string
    status: "planning" | "active" | "completed" | "on_hold"
    created_at: string
    updated_at: string
}

export async function createProjects(projects: Omit<Project, "id" | "created_at" | "updated_at">): Promise<Project> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([{
          ...projects,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single()
  
      if (error) {
        console.error("Supabase error creating project:", error)
        throw new Error(`Failed to create project: ${error.message}`)
      }
  
      if (!data) {
        throw new Error("No data returned from project creation")
      }
  
      return data
    } catch (error) {
      console.error("Error in createProject:", error)
      throw error
    }
}

export async function getProjects() {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error fetching projects:", error)
      throw new Error(`Failed to fetch projects: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error in getProjects:", error)
    throw error
  }
}

export async function getProjectById(id: string) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Supabase error fetching project:", error)
      throw new Error(`Failed to fetch project: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in getProjectById:", error)
    throw error
  }
}

export async function updateProject(id: string, updates: Partial<Omit<Project, "id" | "created_at">>) {
  try {
    const { data, error } = await supabase
      .from("projects")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error updating project:", error)
      throw new Error(`Failed to update project: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error in updateProject:", error)
    throw error
  }
}

export async function deleteProject(id: string) {
  try {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Supabase error deleting project:", error)
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error("Error in deleteProject:", error)
    throw error
  }
}


interface AssignedProject {
  id: string;
  name: string;
}

interface ProjectAdmin {
  project_id: string;
  projects: {
    id: string;
    name: string;
  }[];
}

export async function getAssignedProjects(userId: string): Promise<AssignedProject[]> {
  const supabase = getSupabaseClient()
  
  try {
    const { data: projectAdmins, error } = await supabase
      .from('project_admins')
      .select(`
        project_id,
        projects (
          id,
          name
        )
      `)
      .eq('user_id', userId)

    if (error) throw error

    // Transform the data to match AssignedProject interface
    const projects = projectAdmins?.map(admin => ({
      id: admin.project_id,
      name: admin.projects.name || 'Unnamed Project'
    })) || []

    console.log('Fetched projects:', projects)
    return projects
  } catch (error) {
    console.error("Error loading assigned projects:", error)
    return []
  }
}