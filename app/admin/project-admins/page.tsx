"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Pencil, Trash2, UserCog } from "lucide-react"
import { getUsersByRole, deleteUser } from "@/lib/supabase/users"
import { formatDate } from "@/lib/utils"
import { AddProjectAdminDialog } from "@/components/admin/add-project-admin-dialog"
import { EditProjectAdminDialog } from "@/components/admin/edit-project-admin-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AssignProjectsDialog } from "@/components/admin/assign-projects-dialog"
import { Map } from "lucide-react"


export default function ProjectAdminsPage() {
  const { toast } = useToast()
  const [projectAdmins, setProjectAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showAssignProjectsDialog, setShowAssignProjectsDialog] = useState(false)

  useEffect(() => {
    loadProjectAdmins()
  }, [])

  const loadProjectAdmins = async () => {
    setLoading(true)
    try {
      const data = await getUsersByRole("project-admin")
      setProjectAdmins(data)
    } catch (error) {
      console.error("Error loading project admins:", error)
      toast({
        title: "Error",
        description: "Failed to load project admins. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (admin: any) => {
    setSelectedAdmin(admin)
    setShowEditDialog(true)
  }

  const handleDelete = (admin: any) => {
    setSelectedAdmin(admin)
    setShowDeleteDialog(true)
  }

  const handleAssignProjects = (admin: any) => {
    setSelectedAdmin(admin)
    setShowAssignProjectsDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedAdmin) return

    try {
      await deleteUser(selectedAdmin.id)
      toast({
        title: "Success",
        description: "Project admin deleted successfully.",
      })
      loadProjectAdmins()
    } catch (error) {
      console.error("Error deleting project admin:", error)
      toast({
        title: "Error",
        description: "Failed to delete project admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedAdmin(null)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Project Admins</h1>
          <p className="page-description">Manage project administrators and their assigned campaigns</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project Admin
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Administrators</CardTitle>
          <UserCog className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {projectAdmins.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No project admins found</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                Add your first project admin
              </Button>
            </div>
          ) : (
            <Table className="data-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.status === "active" ? "success" : "secondary"}>{admin.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {admin.assigned_projects && admin.assigned_projects.length > 0 ? (
                        <Badge variant="outline">{admin.assigned_projects.length} projects</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">None assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(admin.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAssignProjects(admin)}
                        >
                          <Map className="h-3.5 w-3.5 mr-1" />
                          Assign
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(admin)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(admin)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddProjectAdminDialog 
        open={showAddDialog} 
        onOpenChange={(open) => {
          setShowAddDialog(open)
          if (!open) setGeneratedPassword(null)
        }}
        onSuccess={(result) => {  // Change parameter to result
          setGeneratedPassword(result.password)  // Extract password from result
          loadProjectAdmins()
        }} 
      />
      
      {/* Add password display dialog */}
      {generatedPassword && (
        <AlertDialog open={!!generatedPassword} onOpenChange={() => setGeneratedPassword(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Project Admin Created Successfully</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>Please save this temporary password. It will be shown only once:</p>
                <div className="bg-muted p-3 rounded-md font-mono">
                  {generatedPassword}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setGeneratedPassword(null)}>Done</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      {selectedAdmin && (
        <>
          <EditProjectAdminDialog
            admin={selectedAdmin}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={loadProjectAdmins}
          />
          
          <AssignProjectsDialog
            admin={selectedAdmin}
            open={showAssignProjectsDialog}
            onOpenChange={setShowAssignProjectsDialog}
            onSuccess={loadProjectAdmins}
          />
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the project admin
                  "{selectedAdmin.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

