"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Pencil, Trash2, UserPlus, MapPin } from "lucide-react"
import { getUsers, deleteUser } from "@/lib/supabase/users"
import { AddPromoterDialog } from "@/components/admin/add-promoter-dialog"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { AssignLocationsDialog } from "@/components/admin/assign-locations-dialog"
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

export default function ProjectAdminPromotersPage() {
  const { toast } = useToast()
  const [promoters, setPromoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedPromoter, setSelectedPromoter] = useState<any>(null)

  const loadPromoters = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      // Filter only promoters
      setPromoters(data.filter((user) => user.role === "promoter"))
    } catch (error) {
      console.error("Error loading promoters:", error)
      toast({
        title: "Error loading promoters",
        description: "There was a problem loading the promoter list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load promoters when component mounts
  useEffect(() => {
    loadPromoters()
  }, [])

  const handleEditPromoter = (promoter: any) => {
    setSelectedPromoter(promoter)
    setShowEditDialog(true)
  }

  const handleDeletePromoter = (promoter: any) => {
    setSelectedPromoter(promoter)
    setShowDeleteDialog(true)
  }

  const handleAssignLocations = (promoter: any) => {
    setSelectedPromoter(promoter)
    setShowAssignDialog(true)
  }

  const confirmDeletePromoter = async () => {
    if (!selectedPromoter) return

    try {
      await deleteUser(selectedPromoter.id)
      toast({
        title: "Promoter deleted",
        description: `${selectedPromoter.name} has been removed successfully.`,
      })
      loadPromoters()
    } catch (error) {
      console.error("Error deleting promoter:", error)
      toast({
        title: "Error deleting promoter",
        description: "There was a problem deleting the promoter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedPromoter(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Promoters</h1>
          <p className="page-description">Manage field data collectors for your campaigns</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Promoter
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Field Data Collectors</CardTitle>
          <UserPlus className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {promoters.length === 0 ? (
            <div className="text-center py-10">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-muted">
                  <UserPlus className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium">No promoters found</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Add your first promoter to start collecting field data
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first promoter
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Locations</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promoters.map((promoter) => (
                    <TableRow key={promoter.id}>
                      <TableCell className="font-medium">{promoter.name}</TableCell>
                      <TableCell>{promoter.email}</TableCell>
                      <TableCell>
                        {promoter.assignedLocations && promoter.assignedLocations.length > 0 ? (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span>{promoter.assignedLocations.length} locations</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">None assigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {promoter.submissions ? promoter.submissions.length : 0} submissions
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promoter.status === "active" ? "success" : "secondary"}>
                          {promoter.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssignLocations(promoter)}
                          >
                            <MapPin className="h-3.5 w-3.5 mr-1" />
                            Assign
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditPromoter(promoter)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeletePromoter(promoter)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reuse existing dialog components */}
      <AddPromoterDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSuccess={loadPromoters} 
      />
      
      {selectedPromoter && (
        <>
          <EditUserDialog 
            open={showEditDialog} 
            onOpenChange={setShowEditDialog} 
            onSuccess={loadPromoters}
            user={selectedPromoter}
          />
          
          <AssignLocationsDialog 
            open={showAssignDialog} 
            onOpenChange={setShowAssignDialog} 
            onSuccess={loadPromoters}
            promoter={selectedPromoter}
          />
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the promoter{' '}
              {selectedPromoter?.name && <strong>{selectedPromoter.name}</strong>}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePromoter} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

