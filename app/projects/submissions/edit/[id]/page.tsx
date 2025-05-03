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
  promoter_id: z.string().min(1, "Promoter is required"),
  project_id: z.string().min(1, "Project is required"),
});

export default function AdminEditSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [allProjectAssignments, setAllProjectAssignments] = useState<any[]>([]);
  const [filteredProjectsForSelectedPromoter, setFilteredProjectsForSelectedPromoter] = useState<any[]>([]);
  const [selectedPromoterId, setSelectedPromoterId] = useState<string | null>(null);

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
      promoter_id: "",
      project_id: "",
    },
  });

  // Load submission data and admin-specific data
  useEffect(() => {
    const loadSubmissionAndAdminData = async () => {
      if (!userProfile) {
        router.push("/login");
        return;
      }

      // Check if user is admin
      if (userProfile.role !== 'project-admin') {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
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
        const submissionData = await getSubmissionById(submissionId);
        setSubmission(submissionData);
        
        // Set selected promoter ID
        setSelectedPromoterId(submissionData.submitted_by);

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
        form.setValue("community_group_type", submissionData.community_group_type);
        form.setValue("participant_count", submissionData.participant_count);
        form.setValue("key_issues", submissionData.key_issues);
        form.setValue("pre_session_dfs_level", submissionData.pre_session_dfs_level);
        form.setValue("post_session_dfs_improvement", submissionData.post_session_dfs_improvement);
        form.setValue("estimated_dfs_adoption_count", submissionData.estimated_dfs_adoption_count);
        form.setValue("promoter_id", submissionData.submitted_by);
        form.setValue("project_id", submissionData.project_id);

        // Load promoters
        const { data: promotersData, error: promotersError } = await supabase
          .from('users')
          .select('id, name')
          .eq('role', 'promoter')
          .order('name', { ascending: true });

        if (promotersError) throw promotersError;
        setPromoters(promotersData || []);

        // Load all project assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('project_promoters')
          .select(`
            user_id,
            project_id,
            projects ( id, name )
          `);

        if (assignmentsError) throw assignmentsError;
        
        const validAssignments = (assignmentsData || [])
          .filter((a: any) => !!a && !!a.user_id && !!a.project_id && !!a.projects)
          .map((a: any) => ({
            user_id: String(a.user_id),
            project_id: String(a.project_id),
            projects: a.projects ? {
              id: String(a.projects.id),
              name: String(a.projects.name)
            } : null
          }))
          .filter((a: any) => a.projects !== null);

        setAllProjectAssignments(validAssignments);

        // Filter projects for the selected promoter
        if (submissionData.submitted_by) {
          const promoterProjects = validAssignments.filter(
            (assignment) => assignment.user_id === submissionData.submitted_by
          );
          setFilteredProjectsForSelectedPromoter(promoterProjects);
        }

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

    loadSubmissionAndAdminData();
  }, [params.id, router, userProfile, toast, form]);

  // Filter projects when selectedPromoterId changes
  useEffect(() => {
    if (selectedPromoterId) {
      const promoterProjects = allProjectAssignments.filter(
        (assignment) => assignment.user_id === selectedPromoterId
      );
      setFilteredProjectsForSelectedPromoter(promoterProjects);
    } else {
      setFilteredProjectsForSelectedPromoter([]);
    }
  }, [selectedPromoterId, allProjectAssignments]);

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
        submitted_by: values.promoter_id, // Admin can change the promoter
        project_id: values.project_id, 
      });

      // Handle new photos (only the ones not in existingPhotos)
      const newPhotos = values.images.filter(
        (url) => !existingPhotos.includes(url)
      );

      // Handle removed photos
      const removedPhotos = existingPhotos.filter(
        (url) => !values.images.includes(url)
      );

      // Add new photos
      if (newPhotos.length > 0) {
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

      // Remove deleted photos
      if (removedPhotos.length > 0) {
        for (const photoUrl of removedPhotos) {
          const { error } = await supabase
            .from("submission_photos")
            .delete()
            .eq("submission_id", submission.id)
            .eq("photo_url", photoUrl);

          if (error) {
            console.error("Error removing photo:", error);
          }
        }
      }

      toast({
        title: "Success",
        description: "Submission has been updated successfully.",
      });
      router.push(`/projects/submissions`);
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
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
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
          Edit Submission (Admin)
        </h1>
        <p className="text-muted-foreground mt-1">
          Update submission details as an administrator
        </p>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              <div className="space-y-4 border-b pb-6">
                <h2 className="text-lg font-semibold text-primary">Assignment Information</h2>
                
                {/* Promoter Selection Field */}
                <FormField
                  control={form.control}
                  name="promoter_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submitted By (Promoter)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedPromoterId(value);
                          // Clear project selection when promoter changes
                          form.setValue("project_id", "");
                        }}
                        value={field.value}
                        disabled={promoters.length === 0 || isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder={isLoading ? "Loading..." : "Select the promoter"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                          {!isLoading && promoters.length === 0 && <SelectItem value="-" disabled>No promoters found</SelectItem>}
                          {promoters.map((promoter) => (
                            <SelectItem key={promoter.id} value={promoter.id}>
                              {promoter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The promoter who collected this data
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Project Selection Field */}
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!selectedPromoterId || filteredProjectsForSelectedPromoter.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder={
                              !selectedPromoterId 
                                ? "Select a promoter first" 
                                : filteredProjectsForSelectedPromoter.length === 0 
                                  ? "No projects for this promoter" 
                                  : "Select project"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {!selectedPromoterId && <SelectItem value="-" disabled>Select promoter first</SelectItem>}
                          {selectedPromoterId && filteredProjectsForSelectedPromoter.length === 0 && 
                            <SelectItem value="-" disabled>No projects assigned to this promoter</SelectItem>
                          }
                          {filteredProjectsForSelectedPromoter.map((proj) => (
                            <SelectItem key={proj.project_id} value={proj.project_id}>
                              {proj.projects?.name || `Project ID: ${proj.project_id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The project this submission belongs to
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-primary">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="activity_stream"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select an activity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTIVITY_STREAM.map((activity) => (
                              <SelectItem key={activity} value={activity}>
                                {activity}
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
                </div>
                
                <FormField
                  control={form.control}
                  name="estimated_dfs_adoption_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated DFS Adoption Count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter estimated count"
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

              <div className="space-y-4 pt-2">
                <h2 className="text-lg font-semibold text-primary">Session Details</h2>
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
                      <FormLabel>Pre-session DFS Awareness Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select pre-session level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRE_SESSION_DFS_LEVEL.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
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
                      <FormLabel>Post-session DFS Improvement</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select improvement level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {POST_SESSION_DFS_IMPROVEMENT.map((improvement) => (
                            <SelectItem key={improvement} value={improvement}>
                              {improvement}
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
                <h2 className="text-lg font-semibold text-primary">Photo Evidence</h2>
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
  );
}