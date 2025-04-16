"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCommunityGroup } from "@/lib/services/community-groups"
import { getLocations } from "@/lib/services/locations.service"
import { useToast } from "@/components/ui/use-toast"
import { Location } from "@/lib/services/locations.service"

interface AddCommunityGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddCommunityGroupDialog({ open, onOpenChange, onSuccess }: AddCommunityGroupDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [locationId, setLocationId] = useState("")
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      loadLocations()
    }
  }, [open])

  const loadLocations = async () => {
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!name.trim()) {
        throw new Error("Name is required")
      }

      if (!type.trim()) {
        throw new Error("Type is required")
      }

      await createCommunityGroup({
        name: name.trim(),
        type: type.trim(),
        location_id: locationId || null
      })

      toast({
        title: "Success",
        description: "Community group created successfully.",
      })

      onSuccess()
      onOpenChange(false)
      setName("")
      setType("")
      setLocationId("")
    } catch (error) {
      console.error("Error creating community group:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create community group. Please try again.",
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
          <DialogTitle>Add Community Group</DialogTitle>
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
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 