"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Pencil, Trash2, MapPin } from "lucide-react"
import { getLocations, deleteLocation, Location } from "@/lib/services/locations"
import { formatDate } from "@/lib/utils"
import { AddLocationDialog } from "@/components/admin/add-location-dialog"
import { EditLocationDialog } from "@/components/admin/edit-location-dialog"
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
import { LocationMapDialog } from "@/components/admin/location-map-dialog"

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const { toast } = useToast()
  const [parentLocations, setParentLocations] = useState<Record<string, string>>({})

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    setLoading(true)
    try {
      const data = await getLocations()
      setLocations(data)
    } catch (error) {
      console.error("Error loading locations:", error)
      toast({
        title: "Error",
        description: "Failed to load locations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (location: Location) => {
    setSelectedLocation(location)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (location: Location) => {
    setSelectedLocation(location)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedLocation) return

    try {
      await deleteLocation(selectedLocation.id)
      toast({
        title: "Success",
        description: "Location deleted successfully.",
      })
      loadLocations()
    } catch (error) {
      console.error("Error deleting location:", error)
      toast({
        title: "Error",
        description: "Failed to delete location. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedLocation(null)
    }
  }

  const handleMapClick = (location: Location) => {
    setSelectedLocation(location)
    setIsMapDialogOpen(true)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Location Management</h1>
          <p className="text-muted-foreground">Manage data collection locations with ease</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary text-white hover:bg-primary-dark">
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
        <AddLocationDialog 
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={loadLocations}
        />
      </div>

      <Card className="shadow-lg border border-muted">
        <CardHeader className="bg-muted-light p-4">
          <CardTitle className="text-lg font-semibold">All Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="table-auto w-full border-collapse">
              <TableHeader>
                <TableRow className="bg-muted-light">
                  <TableHead className="px-4 py-2 text-left">Name</TableHead>
                  <TableHead className="px-4 py-2 text-left">Type</TableHead>
                  <TableHead className="px-4 py-2 text-left">Created</TableHead>
                  <TableHead className="px-4 py-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.length > 0 ? (
                  locations.map((location) => (
                    <TableRow key={location.id} className="hover:bg-muted-light">
                      <TableCell className="px-4 py-2 font-medium text-primary-dark">{location.name}</TableCell>
                      <TableCell className="px-4 py-2 capitalize text-muted-foreground">{location.type}</TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">{formatDate(location.created_at)}</TableCell>
                      <TableCell className="px-4 py-2 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleMapClick(location)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <MapPin className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(location)}
                            className="text-primary hover:text-primary-dark"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(location)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No locations found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedLocation && (
        <>
          <EditLocationDialog
            location={selectedLocation}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={loadLocations}
          />
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the location
                  "{selectedLocation.name}".
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

      {selectedLocation && (
        <LocationMapDialog
          location={selectedLocation}
          open={isMapDialogOpen}
          onOpenChange={setIsMapDialogOpen}
        />
      )}
    </div>
  )
}

