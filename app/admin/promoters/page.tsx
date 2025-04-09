"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Pencil, Trash2, UserCog, MoreHorizontal, Eye, Edit, Trash } from "lucide-react"
import { getUsersByRole, deleteUser } from "@/lib/supabase/users"
import { formatDate } from "@/lib/utils"
import { AddPromoterDialog } from "@/components/admin/add-promoter-dialog"
import { EditPromoterDialog } from "@/components/admin/edit-promoter-dialog"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Users } from "lucide-react"

export default function PromotersPage() {
  const { toast } = useToast()
  const [promoters, setPromoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPromoter, setSelectedPromoter] = useState<any>(null)

  useEffect(() => {
    loadPromoters()
  }, [])

  const loadPromoters = async () => {
    setLoading(true)
    try {
      const data = await getUsersByRole("promoter")
      setPromoters(data)
    } catch (error) {
      console.error("Error loading promoters:", error)
      toast({
        title: "Error",
        description: "Failed to load promoters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (promoter: any) => {
    setSelectedPromoter(promoter)
    setShowEditDialog(true)
  }

  const handleDelete = (promoter: any) => {
    setSelectedPromoter(promoter)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedPromoter) return

    try {
      await deleteUser(selectedPromoter.id)
      toast({
        title: "Success",
        description: "Promoter deleted successfully.",
      })
      loadPromoters()
    } catch (error) {
      console.error("Error deleting promoter:", error)
      toast({
        title: "Error",
        description: "Failed to delete promoter. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowDeleteDialog(false)
      setSelectedPromoter(null)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold sm:text-2xl">Promoters</h1>
          <Button size="sm" className="w-full sm:w-auto" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Promoter
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Promoters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{promoters.length}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Promoter List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Email</TableHead>
                  <TableHead className="text-xs sm:text-sm">Location</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Last Active</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoters.map((promoter) => (
                  <TableRow key={promoter.id}>
                    <TableCell className="text-xs sm:text-sm">{promoter.name}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{promoter.email}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{promoter.location}</TableCell>
                    <TableCell>
                      <Badge variant={promoter.status === 'active' ? 'default' : 'secondary'}>
                        {promoter.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">{promoter.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AddPromoterDialog 
        open={showAddDialog} 
        onOpenChange={setShowAddDialog} 
        onSuccess={loadPromoters} 
      />
      
      {selectedPromoter && (
        <>
          <EditPromoterDialog
            promoter={selectedPromoter}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onSuccess={loadPromoters}
          />
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the promoter
                  "{selectedPromoter.name}" and remove their account.
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

