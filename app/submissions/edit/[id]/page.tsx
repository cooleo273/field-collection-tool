"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ImageUpload } from "@/components/image-upload";
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Camera } from "lucide-react";
import { supabase } from "@/lib/services/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import Image from "next/image";
import { X } from "lucide-react";
import { getSubmissionById, updateSubmission } from "@/lib/services/submissions";

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
];
const ACTIVITY_STREAM = [
  "Training",
  "Workshop",
  "Mass Awareness",
  "DFS Brief",
  "Panel Discussion",
  "IEC Material Distribution",
  "BroadCast Monitoring",
];
const PRE_SESSION_DFS_LEVEL = [
  "Low",
  "Moderate", "High",
]
const POST_SESSION_DFS_IMPROVEMENT = [
  "No Change",
  "Some Improvement",
  "Significant Improvement",
]

// Form schema
const formSchema = z.object({
  activity_stream: z.string().min(1, "Campaign is required"),
  specific_location: z.string().min(1, "Location is required"),
  community_group_type: z.string().min(1, "Community group type is required"),
  participant_count: z.coerce
    .number()
    .min(1, "At least one participant is required"),
  key_issues: z
    .string()
    .min(10, "Please provide more details about key issues discussed"),
  images: z.array(z.string()).min(1, "At least one photo is required"),
  pre_session_dfs_level: z.string().optional(),
  post_session_dfs_improvement: z.string().optional(),
  estimated_dfs_adoption_count: z.coerce
    .number({ invalid_type_error: "Estimated adoption count must be a number" })
    .int("Estimated adoption count must be a whole number")
    .nonnegative("Estimated adoption count cannot be negative")
    .optional(),
});

export default function EditSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [submission, setSubmission] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activity_stream: "",
      specific_location: "",
      community_group_type: "",
      participant_count: 0,
      key_issues: "",
      images: [],
      pre_session_dfs_level: "",
      post_session_dfs_improvement: "",
      estimated_dfs_adoption_count: 0,
    },
  });

  // Load submission data
  useEffect(() => {
    const loadSubmission = async () => {
      if (!userProfile) {
        router.push("/login");
        return;
      }

      const submissionId = params.id as string;
      if (!submissionId) {
        router.push("/submissions");
        return;
      }

      setIsLoading(true);
      try {
        // Load submission data
        // const submissionData = await getSubmissionById(submissionId);
        const submissionData = await getSubmissionById(submissionId);

        // Check if the submission belongs to the current user
        if (submissionData.submitted_by !== userProfile.id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to edit this submission",
            variant: "destructive",
          });
          router.push("/submissions");
          return;
        }

        setSubmission(submissionData);
        // Load existing photos
        const { data: photoData, error: photoError } = await supabase
          .from("submission_photos")
          .select("photo_url")
          .eq("submission_id", submissionId);

        if (!photoError && photoData) {
          const photoUrls = photoData.map((item) => item.photo_url);
          setExistingPhotos(photoUrls);
          form.setValue("images", photoUrls);
        }

        // Set form values
        form.setValue("activity_stream", submissionData.activity_stream);
        form.setValue("specific_location", submissionData.specific_location);
        form.setValue(
          "community_group_type",
          submissionData.community_group_type
        );
        form.setValue("participant_count", submissionData.participant_count);
        form.setValue("key_issues", submissionData.key_issues);
        // Set additional fields
        form.setValue(
          "pre_session_dfs_level",
          submissionData.pre_session_dfs_level
        );
        form.setValue(
          "post_session_dfs_improvement",
          submissionData.post_session_dfs_improvement
        );
        form.setValue(
          "estimated_dfs_adoption_count",
          submissionData.estimated_dfs_adoption_count 
        )
      } catch (error: any) {
        console.error("Error loading submission:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load submission data",
          variant: "destructive",
        });
        router.push("/submissions");
      } finally {
        setIsLoading(false);
      }
    };

    loadSubmission();
  }, [params.id, router, userProfile, toast, form]);

  const handleImageUpload = (url: string) => {
    const currentImages = form.getValues("images");
    form.setValue("images", [...currentImages, url]);
  };

  const handleImageRemove = (urlToRemove: string) => {
    const currentImages = form.getValues("images");
    const updatedImages = currentImages.filter((url) => url !== urlToRemove);
    form.setValue("images", updatedImages);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userProfile || !submission) return;

    setIsSubmitting(true);
    try {
      // Update the submission
      const updatedSubmission = await updateSubmission(submission.id, {
        activity_stream: values.activity_stream,
        specific_location: values.specific_location,
        community_group_type: values.community_group_type,
        participant_count: values.participant_count,
        key_issues: values.key_issues,
        status: submission.status,
        pre_session_dfs_level: values.pre_session_dfs_level,
        post_session_dfs_improvement: values.post_session_dfs_improvement,
        estimated_dfs_adoption_count: values.estimated_dfs_adoption_count,

        // Remove updated_at as it's handled by the updateSubmission function
      });

      // Handle new photos (only the ones not in existingPhotos)
      const newPhotos = values.images.filter(
        (url) => !existingPhotos.includes(url)
      );

      if (updatedSubmission && newPhotos.length > 0) {
        const photoPromises = newPhotos.map(async (imageUrl) => {
          try {
            const { data, error } = await supabase
              .from("submission_photos")
              .insert({
                submission_id: submission.id,
                photo_url: imageUrl,
                created_at: new Date().toISOString(),
              });

            if (error) {
              console.error("Error storing photo reference:", error);
            }
          } catch (err) {
            console.error("Error in photo storage:", err);
          }
        });

        await Promise.all(photoPromises);
      }

      toast({
        title: "Success",
        description: "Your submission has been updated successfully.",
      });
      router.push(`/submissions/${submission.id}`);
    } catch (error: any) {
      console.error("Error updating submission:", error);
      toast({
        title: "Error",
        description: `Failed to update submission. Please try again. Details: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Check if the submission is approved
  if (submission?.status === "approved") {
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
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Submission Approved
            </h1>
            <p className="text-muted-foreground mt-1">
              This submission has already been approved and cannot be edited.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
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
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Edit Submission
          </h1>
          <p className="text-muted-foreground mt-1">
            Update your field data submission
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="activity_stream"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
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
                      name="specific_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specific Location</FormLabel>
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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
                            <Input
                              type="number"
                              min="1"
                              className="h-10"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estimated_dfs_adoption_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Enter total count"
                              className="h-10"
                              {...field}
                              value={field.value ?? ''}
                              onChange={e => {
                                const value = e.target.value;
                                field.onChange(value === '' ? undefined : Number(value));
                              }}
                            />
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
                          Provide details about the topics discussed and
                          outcomes of the session
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                      control={form.control}
                      name="pre_session_dfs_level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre-session DFS Awareness, Trust and Confidence level of participants</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select an activity type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PRE_SESSION_DFS_LEVEL.map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a}
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
                      name="post_session_dfs_improvement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post-session DFS Awareness, Trust and Confidence level of participants</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select Post Session DFS Awareness" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {POST_SESSION_DFS_IMPROVEMENT.map((a) => (
                                <SelectItem key={a} value={a}>
                                  {a}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                <div
                                  key={index}
                                  className="relative group aspect-square"
                                >
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
  );
}
