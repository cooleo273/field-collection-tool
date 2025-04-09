"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { LoadingSpinner } from "@/components/loading-spinner"
import { createSubmission } from "@/lib/supabase/submissions"
import { uploadImage } from "@/lib/supabase/storage"
import { getLocations, getLocationsByCampaign } from "@/lib/supabase/locations"
import { getCampaigns } from "@/lib/supabase/campaigns"
import { useAuth } from "@/contexts/auth-context"

const COMMUNITY_GROUPS = [
    "Women Associations",
    "Youth/Students",
    "Small Business owners",
    "Religious leaders",
    "SACCOs/Farmers' COPs",
    "Civic Based Organizations (Idir, Iquib)",
    "General Public (Market Places)",
    "General Public (Gatherings)",
    "Consumers",
    "Rural radio listeners",
    "Others",
]

// Updated form schema to match the database schema
const formSchema = z.object({
    campaign_id: z.string().min(1, "Campaign is required"),
    location_id: z.string().min(1, "Location is required"),
    community_group_type: z.string().min(1, "Community group type is required"),
    participant_count: z.coerce.number().min(1, "At least one participant is required"),
    key_issues: z.string().min(10, "Please provide more details about key issues discussed"),
    images: z.array(z.string()).min(1, "At least one photo is required"),
})

export default function NewSubmissionPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { userProfile } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [uploadedImageUrl, setUploadedImageUrl] = useState("")

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            campaign_id: "",
            location_id: "",
            community_group_type: "",
            participant_count: 0,
            key_issues: "",
            images: [],
        },
    })

    useEffect(() => {
        const loadData = async () => {
            if (!userProfile) return

            setIsLoading(true)
            try {
                const campaignsData = await getCampaigns()
                setCampaigns(campaignsData);
            } catch (error) {
                console.error("Error loading data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load form data. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [userProfile, toast])

    // Load locations when campaign changes
    useEffect(() => {
        const loadLocations = async () => {
            try {
                const locationsData = await getLocations()
                setLocations(locationsData);
            } catch (error) {
                console.error("Error loading locations:", error)
                toast({
                    title: "Error",
                    description: "Failed to load locations. Please try again.",
                    variant: "destructive",
                })
            }
        }

        loadLocations()
    }, [form.watch("campaign_id"), toast])

    const handleImageUpload = (url: string) => {
        const currentImages = form.getValues("images")
        form.setValue("images", [...currentImages, url])
    }

    const handleImageRemove = () => {
        setUploadedImageUrl("")
        const currentImages = form.getValues("images")
        if (currentImages.length > 0) {
            form.setValue("images", currentImages.slice(0, -1))
        }
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!userProfile) return

        setIsSubmitting(true)
        try {
            const submission = await createSubmission({
                campaign_id: values.campaign_id,
                location_id: values.location_id,
                community_group_type: values.community_group_type,
                participant_count: values.participant_count,
                key_issues: values.key_issues,
                status: "draft", //  <---  Status is now set to 'draft' as per schema
                submitted_by: userProfile.id,
                submitted_at: new Date().toISOString(),
                sync_status: "local", // <--- sync_status is set to 'synced' as per schema
            })

            if (submission) {
                toast({
                    title: "Success",
                    description: "Your submission has been created successfully.",
                })
                router.push("/submissions")
            }
        } catch (error: any) {
            console.error("Error creating submission:", error)
            toast({
                title: "Error",
                description: `Failed to create submission. Please try again. Details: ${error.message}`,
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return <LoadingSpinner />
    }

    return (
        <div className="container py-10">
            <Card>
                <CardHeader>
                    <CardTitle>New Submission</CardTitle>
                    <CardDescription>
                        Create a new field data submission for your assigned location
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="campaign_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Campaign</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a campaign" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {campaigns.map((campaign) => (
                                                        <SelectItem key={campaign.id} value={campaign.id}>
                                                            {campaign.name}
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
                                    name="location_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a location" />
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
                                    name="community_group_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Community Group Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a group type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {COMMUNITY_GROUPS.map((group) => (
                                                        <SelectItem key={group} value={group}>
                                                            {group}
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
                                    name="participant_count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Participants</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="key_issues"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Key Issues/Takeaways</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe the key issues discussed and main takeaways from the session..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Provide details about the topics discussed and outcomes of the session
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="images"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Photo Evidence</FormLabel>
                                        <FormControl>
                                            <ImageUpload
                                                value={uploadedImageUrl}
                                                onUpload={handleImageUpload}
                                                onRemove={handleImageRemove}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Upload photos from the engagement session (at least one photo is required)
                                        </FormDescription>
                                        <FormMessage />
                                        {field.value.length > 0 && (
                                            <div className="mt-2 text-sm text-muted-foreground">
                                                {field.value.length} photo{field.value.length > 1 ? "s" : ""} uploaded
                                            </div>
                                        )}
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <LoadingSpinner className="mr-2 h-4 w-4" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Submission"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}

