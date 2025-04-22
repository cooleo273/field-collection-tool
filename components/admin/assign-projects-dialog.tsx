"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {getProjects, getAdminProjects, assignProjectsToAdmin} from "@/lib/repositories/project.repository"


interface AssignProjectsDialogProps {
  admin: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AssignProjectsDialog({
  admin,
  open,
  onOpenChange,
  onSuccess,
}: AssignProjectsDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])

  useEffect(() => {
    if (open && admin) {
      loadData()
    }
  }, [open, admin])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all projects
      const allProjects = await getProjects()
      setProjects(allProjects)

      // Load admin's assigned projects
      const adminProjects = await getAdminProjects(admin.id)
      if (Array.isArray(adminProjects)) {
        const adminProjectIds = adminProjects.map((p: any) => p.project_id || p.id)
        setSelectedProjects(adminProjectIds)
      } else {
        console.error("Unexpected response format for adminProjects:", adminProjects)
        setSelectedProjects([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await assignProjectsToAdmin(admin.id, selectedProjects)
      toast({
        title: "Success",
        description: "Projects assigned successfully.",
      })
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error("Error assigning projects:", error)
      toast({
        title: "Error",
        description: "Failed to assign projects. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleProject = (projectId: string) => {
    setSelectedProjects((current) => {
      if (current.includes(projectId)) {
        return current.filter((id) => id !== projectId)
      } else {
        return [...current, projectId]
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Projects</DialogTitle>
          <DialogDescription>
            Select projects to assign to {admin?.name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No projects available. Create projects first.
                </p>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 py-1">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {project.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || saving}>
            {saving ? <LoadingSpinner className="mr-2 h-4 w-4" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}