"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateCommunityGroup } from "@/lib/services/community-groups"
import { getLocations } from "@/lib/services/locations.service"
import { useToast } from "@/components/ui/use-toast"
import { Location } from "@/lib/services/locations.service"
import { CommunityGroup } from "@/lib/services/community-groups"

interface EditCommunityGroupDialogProps {
  group: CommunityGroup
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditCommunityGroupDialog({ group, open, onOpenChange, onSuccess }: EditCommunityGroupDialogProps) {
  const [name, setName] = useState(group.name)
  const [type, setType] = useState(group.type)
  const [locationId, setLocationId] = useState(group.location_id || "")
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadLocations()
  }, [])

  const loadLocations = async () => {
    try {
      const data = await getLocations()
      setLocations(data)
    } catch (error) {
      console.error("Error loading locations:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateCommunityGroup(group.id, {
        name,
        type,
        location_id: locationId || null
      })

      toast({
        title: "Success",
        description: "Community group updated successfully.",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating community group:", error)
      toast({
        title: "Error",
        description: "Failed to update community group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Community Group</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="women">Women's Group</SelectItem>
                <SelectItem value="youth">Youth Group</SelectItem>
                <SelectItem value="farmers">Farmers' Group</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 