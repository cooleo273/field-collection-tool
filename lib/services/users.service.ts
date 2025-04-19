import { getSupabaseClient, supabase } from "./client";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  assignedLocations?: string[];
};

type UserUpdate = Partial<Omit<User, "id" | "created_at" | "updated_at">> & {
  assignedLocations?: string[];
};

export default class UserService {
  constructor() {}

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          promoter_locations (
            location_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((user) => ({
        ...user,
        assignedLocations: user.promoter_locations?.map((pl: { location_id: string }) => pl.location_id) || [],
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  }


  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("email", email).single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return null;
    }
  }

  async createUserWithAuth(userData: { 
    name: string; 
    email: string; 
    role: string; 
    status?: string;
    projectId?: string;
  }): Promise<{ user: User; password: string }> {
    try {
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
  
      if (userData.role === 'promoter' && userData.projectId && data.user?.id) {
        const { data: promoterData, error: projectError } = await supabase
          .from('project_promoters')
          .insert({
            user_id: data.user.id,
            project_id: userData.projectId
          })
          .select()
          .single();
  
        if (projectError) {
          console.error('Error creating project promoter:', projectError);
          await supabase.from('users').delete().eq('id', data.user.id);
          throw new Error(`Failed to create project promoter association: ${projectError.message}`);
        }
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

  async createUser(user: {
    name: string;
    email: string;
    role: string;
    status?: string;
  }): Promise<User> {
    try {
      const { data, error } = await supabase.from("users").insert(user).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: string, data: UserUpdate): Promise<User | null> {
    try {
      const { data: user, error } = await supabase
        .from("users")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      if (data.assignedLocations) {
        await this.updateAssignedLocations(id, data.assignedLocations);
      }

      return user;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  private async updateAssignedLocations(userId: string, locations: string[]): Promise<void> {
    try {
      await supabase.from("promoter_locations").delete().eq("user_id", userId);
      if (locations.length > 0) {
        const assignments = locations.map((locationId) => ({ user_id: userId, location_id: locationId }));
        const { error } = await supabase.from("promoter_locations").insert(assignments);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating assigned locations:", error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      let query = supabase
        .from("users")
        .select("*")
        .eq("role", role)
        .order("created_at", { ascending: false })
      
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

  async assignProjectsToAdmin(adminId: string, projectIds: string[]): Promise<void> {
    try {
      await supabase.from("project_admins").delete().eq("user_id", adminId);
      if (projectIds.length > 0) {
        const assignments = projectIds.map((projectId) => ({ project_id: projectId, user_id: adminId }));
        const { error } = await supabase.from("project_admins").insert(assignments);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error assigning projects to admin:", error);
      throw error;
    }
  }

  async getAdminProjects(adminId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("project_admins")
        .select("project_id, projects(id, name, status)")
        .eq("user_id", adminId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error getting admin projects:", error);
      throw error;
    }
  }

  async getUserCount(): Promise<number> {
    const { count, error } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Service Error:", error);
      throw error;
    }

    return count ?? 0;
  }
  async resetUserPassword(id: string): Promise<string> {
    try {
      const response = await fetch(`/api/users/${id}/reset-password`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to reset password");
      return data.message;
    } catch (error) {
      console.error("Error resetting user password:", error);
      throw error;
    }
  }

  // Fixed the return type of the `assignLocationsToPromoter` method to `Promise<boolean>`
  async assignLocationsToPromoter(userId: string, projectId: string, locationIds: string[]): Promise<boolean> {
    try {
      const { data: existingAssignment, error: checkError } = await supabase
        .from('project_promoters')
        .select('*')
        .eq('user_id', userId)
        .eq('project_id', projectId)
        .single()
    
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError
      }
    
      if (!existingAssignment) {
        const { error: assignError } = await supabase
          .from('project_promoters')
          .insert({ user_id: userId, project_id: projectId })
    
        if (assignError) throw assignError
      }
    
      await supabase
        .from('project_promoter_locations')
        .delete()
        .eq('user_id', userId)
        .eq('project_id', projectId)
    
      if (locationIds.length === 0) return true
    
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

  // Fixed the return type of `getProjectPromoters` to match `PromoterWithProjectData[]`
  async getProjectPromoters(projectId: string, adminId: string): Promise<PromoterWithProjectData[]> {
    try {
      const { data, error } = await supabase
        .from('project_promoters')
        .select(`
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
        .eq('project_id', projectId)
    
      if (error) {
        console.error("Error fetching project promoters:", error)
        throw error
      }
    
      return data?.map(item => {
        const user = Array.isArray(item.users) ? (item.users[0] as User) : (item.users as User);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          assignedLocations: item.project_promoter_locations || [],
          submissions: []
        }
      }) || []
    } catch (error) {
      console.error("Error in getProjectPromoters:", error)
      throw error
    }
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

