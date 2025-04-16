import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { updateUser } from "@/lib/services/users"
import { supabase } from "@/lib/services/client"
import { LoadingSpinner } from "@/components/loading-spinner"

interface AssignLocationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  promoter: any
}

export function AssignLocationsDialog({
  open,
  onOpenChange,
  onSuccess,
  promoter
}: AssignLocationsDialogProps) {
  const { toast } = useToast()
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      loadLocations()
      loadAssignedLocations()
    }
  }, [open])

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error loading locations:', error)
      toast({
        title: "Error loading locations",
        description: "There was a problem loading the locations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('promoter_locations')
        .select('location_id')
        .eq('user_id', promoter.id)

      if (error) throw error
      setSelectedLocations(data?.map(item => item.location_id) || [])
    } catch (error) {
      console.error('Error loading assigned locations:', error)
      toast({
        title: "Error loading assigned locations",
        description: "There was a problem loading the assigned locations. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await updateUser(promoter.id, {
        assignedLocations: selectedLocations
      })

      toast({
        title: "Locations assigned",
        description: "The locations have been successfully assigned to the promoter.",
      })
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Error assigning locations:', error)
      toast({
        title: "Error assigning locations",
        description: "There was a problem assigning the locations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Assign Locations to {promoter.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredLocations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={location.id}
                    checked={selectedLocations.includes(location.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLocations([...selectedLocations, location.id])
                      } else {
                        setSelectedLocations(selectedLocations.filter(id => id !== location.id))
                      }
                    }}
                  />
                  <Label htmlFor={location.id}>{location.name}</Label>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || selectedLocations.length === 0}
            >
              {submitting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Assigning...
                </>
              ) : (
                'Assign Locations'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 