"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getSubmissionById, updateSubmission } from "@/lib/supabase/submissions"
import { uploadImage } from "@/lib/supabase/storage"
import { getLocations } from "@/lib/supabase/locations"
import { getCampaigns } from "@/lib/supabase/campaigns"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Camera } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import Image from "next/image"
import { X } from "lucide-react" // Add this import

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

// Form schema
const formSchema = z.object({
    campaign_id: z.string().min(1, "Campaign is required"),
    location_id: z.string().min(1, "Location is required"),
    community_group_type: z.string().min(1, "Community group type is required"),
    participant_count: z.coerce.number().min(1, "At least one participant is required"),
    key_issues: z.string().min(10, "Please provide more details about key issues discussed"),
    images: z.array(z.string()).min(1, "At least one photo is required"),
})

export default function EditSubmissionPage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const { userProfile } = useAuth()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [locations, setLocations] = useState<any[]>([])
    const [uploadedImageUrl, setUploadedImageUrl] = useState("")
    const [existingPhotos, setExistingPhotos] = useState<string[]>([])
    const [submission, setSubmission] = useState<any>(null)

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

    // Load submission data
    useEffect(() => {
        const loadSubmission = async () => {
            if (!userProfile) {
                router.push("/login")
                return
            }

            const submissionId = params.id as string
            if (!submissionId) {
                router.push("/submissions")
                return
            }

            setIsLoading(true)
            try {
                // Load submission data
                const submissionData = await getSubmissionById(submissionId)
                
                // Check if the submission belongs to the current user
                if (submissionData.submitted_by !== userProfile.id) {
                    toast({
                        title: "Access Denied",
                        description: "You don't have permission to edit this submission",
                        variant: "destructive",
                    })
                    router.push("/submissions")
                    return
                }

                setSubmission(submissionData)

                // Load form data
                const campaignsData = await getCampaigns()
                const locationsData = await getLocations()
                setCampaigns(campaignsData)
                setLocations(locationsData)

                // Load existing photos
                const { data: photoData, error: photoError } = await supabase
                    .from("submission_photos")
                    .select("photo_url")
                    .eq("submission_id", submissionId)

                if (!photoError && photoData) {
                    const photoUrls = photoData.map(item => item.photo_url)
                    setExistingPhotos(photoUrls)
                    form.setValue("images", photoUrls)
                }

                // Set form values
                form.setValue("campaign_id", submissionData.campaign_id)
                form.setValue("location_id", submissionData.location_id)
                form.setValue("community_group_type", submissionData.community_group_type)
                form.setValue("participant_count", submissionData.participant_count)
                form.setValue("key_issues", submissionData.key_issues)
            } catch (error: any) {
                console.error("Error loading submission:", error)
                toast({
                    title: "Error",
                    description: error.message || "Failed to load submission data",
                    variant: "destructive",
                })
                router.push("/submissions")
            } finally {
                setIsLoading(false)
            }
        }

        loadSubmission()
    }, [params.id, router, userProfile, toast, form])

    const handleImageUpload = (url: string) => {
        const currentImages = form.getValues("images")
        form.setValue("images", [...currentImages, url])
    }

    const handleImageRemove = (urlToRemove: string) => {
        const currentImages = form.getValues("images")
        const updatedImages = currentImages.filter(url => url !== urlToRemove)
        form.setValue("images", updatedImages)
    }

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (!userProfile || !submission) return

        setIsSubmitting(true)
        try {
            // Update the submission
            const updatedSubmission = await updateSubmission(submission.id, {
                campaign_id: values.campaign_id,
                location_id: values.location_id,
                community_group_type: values.community_group_type,
                participant_count: values.participant_count,
                key_issues: values.key_issues,
                status: submission.status,
                // Remove updated_at as it's handled by the updateSubmission function
            })

            // Handle new photos (only the ones not in existingPhotos)
            const newPhotos = values.images.filter(url => !existingPhotos.includes(url))
            
            if (updatedSubmission && newPhotos.length > 0) {
                const photoPromises = newPhotos.map(async (imageUrl) => {
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

            toast({
                title: "Success",
                description: "Your submission has been updated successfully.",
            })
            router.push(`/submissions/${submission.id}`)
        } catch (error: any) {
            console.error("Error updating submission:", error)
            toast({
                title: "Error",
                description: `Failed to update submission. Please try again. Details: ${error.message}`,
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex h-full items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </DashboardLayout>
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
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Edit Submission</h1>
                    <p className="text-muted-foreground mt-1">
                        Update your field data submission
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
                                            name="campaign_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Campaign</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10">
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
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10">
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
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="community_group_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Community Group Type</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
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
                                                <div className="space-y-4">
                                                    {/* Existing Photos Grid */}
                                                    {field.value.length > 0 && (
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                            {field.value.map((url, index) => (
                                                                <div key={index} className="relative group aspect-square">
                                                                    <Image
                                                                        src={url}
                                                                        alt={`Photo ${index + 1}`}
                                                                        fill
                                                                        className="object-cover rounded-lg"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleImageRemove(url)}
                                                                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="h-4 w-4 text-white" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                
                                                    {/* Upload New Photos */}
                                                    <div className="bg-muted/30 rounded-lg p-4">
                                                        <FormControl>
                                                            <div className="max-w-sm mx-auto">
                                                                <ImageUpload
                                                                    value={uploadedImageUrl}
                                                                    onUpload={handleImageUpload}
                                                                    onRemove={() => setUploadedImageUrl("")}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        
                                                        <div className="mt-4 text-sm text-center text-muted-foreground">
                                                            <Camera className="h-4 w-4 inline-block mr-1" />
                                                            {field.value.length === 0 
                                                                ? "At least one photo is required" 
                                                                : "Add more photos (optional)"}
                                                        </div>
                                                        <FormMessage />
                                                    </div>
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
                                                Updating...
                                            </>
                                        ) : (
                                            "Update Submission"
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

