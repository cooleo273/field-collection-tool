"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/image-upload"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { getLocations } from "@/lib/mock-data/locations"
import { getCommunityGroups, getCommunityGroupTypes } from "@/lib/mock-data/community-groups"

// Form validation schema
const formSchema = z.object({
  locationId: z.string().min(1, "Please select an area/kebele"),
  communityGroupId: z.string().min(1, "Please select a community group"),
  communityGroupType: z.string().min(1, "Please select a community group type"),
  participantCount: z.coerce.number().min(1, "Must have at least one participant"),
  keyIssues: z.string().min(10, "Please provide key issues or takeaways"),
  photoProof: z.array(z.string()).min(1, "Please upload at least one photo"),
})

interface EditSubmissionFormProps {
  submission: any
  onUpdate: (data: any) => void
  userId: string
}

export function EditSubmissionForm({ submission, onUpdate, userId }: EditSubmissionFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locations, setLocations] = useState<any[]>([])
  const [communityGroups, setCommunityGroups] = useState<any[]>([])
  const [communityGroupTypes, setCommunityGroupTypes] = useState<string[]>([])

  // Initialize form with submission data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: submission.locationId || "",
      communityGroupId: submission.communityGroupId || "",
      communityGroupType: submission.communityGroupType || "",
      participantCount: submission.participantCount || 0,
      keyIssues: submission.keyIssues || "",
      photoProof: submission.photoProof || [],
    },
  })

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, groupsData, typesData] = await Promise.all([
          getLocations(),
          getCommunityGroups(),
          getCommunityGroupTypes(),
        ])

        setLocations(locationsData)
        setCommunityGroups(groupsData)
        setCommunityGroupTypes(typesData)
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load form data. Please try again.",
          variant: "destructive",
        })
      }
    }

    loadData()
  }, [toast])

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to update data.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get names for the selected IDs
      const location = locations.find((l) => l.id === values.locationId)
      const communityGroup = communityGroups.find((g) => g.id === values.communityGroupId)

      // Create updated submission object
      const updatedSubmission = {
        ...values,
        locationName: location?.name || "",
        communityGroupName: communityGroup?.name || "",
        // Keep the original status, submittedBy, etc.
      }

      await onUpdate(updatedSubmission)
    } catch (error) {
      console.error("Error updating submission:", error)
      toast({
        title: "Error",
        description: "Failed to update submission. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area/Kebele</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area/kebele" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communityGroupType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Community Group Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select group type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {communityGroupTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communityGroupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Community Group</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select community group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {communityGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="participantCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Participants</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="keyIssues"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key Issues/Takeaways</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter key issues or takeaways from the session"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photoProof"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo Proof</FormLabel>
              <FormControl>
                <ImageUpload value={field.value} onChange={field.onChange} maxFiles={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Submission"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

