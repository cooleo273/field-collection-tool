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
import { createSubmission } from "@/lib/services/submissions"
import { uploadImage } from "@/lib/services/storage.service"
import { getLocations, getLocationsByCampaign } from "@/lib/services/locations"
import { getAssignedCampaigns, getCampaigns } from "@/lib/services/campaigns"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Camera, ClipboardList, Upload } from "lucide-react"
import { supabase } from "@/lib/services/client"
import { DashboardLayout } from "@/components/dashboard-layout"

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
const ACTIVITY_STREAM =[
    "Training", 
    "Workshop",
    "Mass Awareness",
    "DFS Brief",
    "Panel Discussion",
    "IEC Material Distribution",
    "BroadCast Monitoring"
]

// Updated form schema to match the database schema
const formSchema = z.object({
    activity_stream: z.string().min(1, "Activity is required"),
    location: z.string().min(1, "Location is required"),
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
            activity_stream:"",
            location: "",
            community_group_type: "",
            participant_count: 0,
            key_issues: "",
            images: [],
        },
    })

    // Removed the logic for loading assigned campaigns
    useEffect(() => {
        const loadData = async () => {
            if (!userProfile) return

            setIsLoading(true)
            try {
                // Removed the logic for fetching assigned campaigns
                setCampaigns([]) // Set campaigns to an empty array
            } catch (error) {
                console.error("Error loading data:", error)
                toast({
                    title: "Error",
                    description: "Failed to load campaigns. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [userProfile, toast, router])

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
            // Create the submission
            const submission = await createSubmission({
                activity_stream: values.activity_stream,
                location: values.location,
                community_group_type: values.community_group_type,
                participant_count: values.participant_count,
                key_issues: values.key_issues,
                status: "draft",
                submitted_by: userProfile.id,
                submitted_at: new Date().toISOString(),
                sync_status: "local",
            })

            // Store the photo URLs in the submission_photos table
            if (submission && values.images.length > 0) {
                const photoPromises = values.images.map(async (imageUrl) => {
                    try {
                        const { data, error } = await supabase
                            .from('submission_photos')
                            .insert({
                                submission_id: submission.id,
                                photo_url: imageUrl,
                                created_at: new Date().toISOString()
                            })
                        
                        if (error) {
                            console.error("Error storing photo reference:", error)
                        }
                    } catch (err) {
                        console.error("Error in photo storage:", err)
                    }
                })
                
                await Promise.all(photoPromises)
            }

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
        return (
            <div className="flex min-h-screen items-center justify-center">
                <LoadingSpinner />
            </div>
        )
    }

    return (
        <DashboardLayout>
        <div className="container max-w-4xl mx-auto px-4 py-6 md:py-10">
            <div className="mb-6">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.back()}
                    className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back
                </Button>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">New Submission</h1>
                <p className="text-muted-foreground mt-1">
                    Record field data from your community engagement
                </p>
            </div>
            
            <Card className="border shadow-sm">
                <CardContent className="pt-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Basic Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="activity_stream"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Activity</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-10">
                                                            <SelectValue placeholder="Select an activity" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                    {ACTIVITY_STREAM.map((group) => (
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
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input type="text" className="h-10" {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="community_group_type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Community Group Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-10">
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
                                                    <Input type="number" min="1" className="h-10" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <h2 className="text-lg font-semibold">Session Details</h2>
                                <FormField
                                    control={form.control}
                                    name="key_issues"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Key Issues/Takeaways</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe the key issues discussed and main takeaways from the session..."
                                                    className="min-h-[120px] resize-y"
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
                            </div>

                            <div className="space-y-4 pt-2">
                                <h2 className="text-lg font-semibold">Photo Evidence</h2>
                                <FormField
                                    control={form.control}
                                    name="images"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="bg-muted/30 rounded-lg p-4">
                                                <FormControl>
                                                    <div className="max-w-sm mx-auto">
                                                        <ImageUpload
                                                            value={uploadedImageUrl}
                                                            onUpload={handleImageUpload}
                                                            onRemove={handleImageRemove}
                                                        />
                                                    </div>
                                                </FormControl>
                                                
                                                {field.value.length > 0 ? (
                                                    <div className="mt-4 text-sm text-center">
                                                        <span className="font-medium text-primary">
                                                            {field.value.length} photo{field.value.length > 1 ? "s" : ""} uploaded
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-4 text-sm text-center text-muted-foreground">
                                                        <Camera className="h-4 w-4 inline-block mr-1" />
                                                        At least one photo is required
                                                    </div>
                                                )}
                                                <FormMessage />
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="pt-4 border-t flex flex-col sm:flex-row sm:justify-end gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto order-2 sm:order-1"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="w-full sm:w-auto order-1 sm:order-2"
                                >
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
        </DashboardLayout>
    )
}

