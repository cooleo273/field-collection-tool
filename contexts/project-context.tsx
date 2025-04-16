"use client"

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { getProjectByAdmin, getProjectById } from '@/lib/supabase/projects'

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

interface ProjectContextType {
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  isLoading: boolean
  refreshProjectFromStorage: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { userProfile } = useAuth()
  const [storedProjectId, setStoredProjectId] = useState<string | null>(null)

  // Add effect to safely access localStorage (client-side only)
  useEffect(() => {
    // This will only run on the client side
    const savedProjectId = typeof window !== 'undefined' ? localStorage.getItem('selectedProjectId') : null
    setStoredProjectId(savedProjectId)
  }, [])

  // Function to refresh project from localStorage
  const refreshProjectFromStorage = async () => {
    if (typeof window === 'undefined' || !userProfile) return;
    
    const currentStoredId = localStorage.getItem('selectedProjectId');
    console.log("Refreshing project from storage, ID:", currentStoredId);
    
    if (currentStoredId) {
      try {
        const projectData = await getProjectById(currentStoredId);
        if (projectData) {
          console.log("Setting project from storage refresh:", projectData);
          setCurrentProject(projectData);
        }
      } catch (error) {
        console.error("Error refreshing project:", error);
      }
    }
  };

  // Add this function to the ProjectProvider component
  useEffect(() => {
    const initializeProject = async () => {
      if (!userProfile) return;
      
      try {
        // Get project ID from localStorage (client-side only)
        const storedProjectId = typeof window !== 'undefined' 
          ? localStorage.getItem('selectedProjectId') 
          : null;
        
        console.log("ProjectContext - Initializing with stored ID:", storedProjectId);
        
        if (storedProjectId) {
          // Try to fetch the specific project by ID
          const projectData = await getProjectById(storedProjectId);
          
          if (projectData) {
            console.log("ProjectContext - Setting project from localStorage:", projectData);
            setCurrentProject(projectData);
            return;
          } else {
            console.log("ProjectContext - Stored project ID not found, falling back to admin projects");
          }
        }
        
        // Fallback: Get projects for the admin
        const adminProjects = await getProjectByAdmin(userProfile.id);
        
        if (adminProjects && Array.isArray(adminProjects) && adminProjects.length > 0) {
          console.log("ProjectContext - Setting first admin project:", adminProjects[0]);
          setCurrentProject(adminProjects[0]);
          
          // Update localStorage with this project
          if (typeof window !== 'undefined') {
            localStorage.setItem('selectedProjectId', adminProjects[0].id);
          }
        }
      } catch (error) {
        console.error("Error initializing project:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeProject();
  }, [userProfile]);

  // Listen for storage events (changes from other tabs/components)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedProjectId' && e.newValue) {
        console.log("Storage event detected, new project ID:", e.newValue);
        refreshProjectFromStorage();
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, []);

  // Update localStorage when currentProject changes
  useEffect(() => {
    if (currentProject?.id && typeof window !== 'undefined') {
      localStorage.setItem('selectedProjectId', currentProject.id);
      setStoredProjectId(currentProject.id);
    }
  }, [currentProject]);

  return (
    <ProjectContext.Provider value={{ 
      currentProject, 
      setCurrentProject, 
      isLoading,
      refreshProjectFromStorage
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}