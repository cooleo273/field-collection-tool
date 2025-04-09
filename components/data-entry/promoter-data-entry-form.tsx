"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { createSubmission } from "@/lib/mock-data/submissions"
import { saveSubmissionOffline } from "@/lib/offline-storage"

// Form validation schema
const formSchema = z.object({
  locationId: z.string().min(1, "Please select an area/kebele"),
  communityGroupId: z.string().min(1, "Please select a community group"),
  communityGroupType: z.string().min(1, "Please select a community group type"),
  participantCount: z.coerce.number().min(1, "Must have at least one participant"),
  keyIssues: z.string().min(10, "Please provide key issues or takeaways"),
  photoProof: z.array(z.string()).min(1, "Please upload at least one photo"),
})

interface PromoterDataEntryFormProps {
  userId: string
}

export function PromoterDataEntryForm({ userId }: PromoterDataEntryFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locations, setLocations] = useState<any[]>([])
  const [communityGroups, setCommunityGroups] = useState<any[]>([])
  const [communityGroupTypes, setCommunityGroupTypes] = useState<string[]>([])
  const [showParticipants, setShowParticipants] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locationId: "",
      communityGroupId: "",
      communityGroupType: "",
      participantCount: 0,
      keyIssues: "",
      photoProof: [],
    },
  })

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const locationsData = await getLocations()
        const groupsData = await getCommunityGroups()
        const typesData = await getCommunityGroupTypes()

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
        description: "You must be logged in to submit data.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get names for the selected IDs
      const location = locations.find((l) => l.id === values.locationId)
      const communityGroup = communityGroups.find((g) => g.id === values.communityGroupId)

      // Create submission object
      const submission = {
        id: crypto.randomUUID(),
        ...values,
        locationName: location?.name || "",
        communityGroupName: communityGroup?.name || "",
        status: "draft",
        submittedBy: userId,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "local",
      }

      // Check if online
      if (navigator.onLine) {
        // Save to mock data service
        await createSubmission(submission)

        toast({
          title: "Success",
          description: "Your data has been submitted successfully.",
          variant: "success",
        })
      } else {
        // Save to offline storage
        await saveSubmissionOffline(submission)

        toast({
          title: "Saved offline",
          description: "Your data has been saved locally and will be synced when online.",
        })
      }

      router.push("/submissions")
    } catch (error) {
      console.error("Error saving submission:", error)
      toast({
        title: "Error",
        description: "Failed to save data. Please try again.",
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

        <div className="space-y-2">
          <h3 className="text-lg font-medium">Participant Details (Optional)</h3>
          <p className="text-sm text-muted-foreground">You can collect participant details after the campaign</p>

          <Button type="button" variant="outline" onClick={() => setShowParticipants(!showParticipants)}>
            {showParticipants ? "Hide" : "Add"} Participant Details
          </Button>

          {showParticipants && (
            <div className="mt-4 border rounded-md p-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="participant-name">Participant Name</Label>
                    <Input id="participant-name" placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="participant-gender">Gender</Label>
                    <Select>
                      <SelectTrigger id="participant-gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="participant-age">Age</Label>
                    <Input id="participant-age" type="number" min="1" placeholder="Age" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="participant-phone">Phone Number (Optional)</Label>
                    <Input id="participant-phone" placeholder="Phone number" />
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm">
                  Add Another Participant
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Data"}
          </Button>
        </div>
      </form>
    </Form>
  )
}

