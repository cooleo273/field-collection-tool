"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Camera, FileText } from "lucide-react";
import { supabase } from "@/lib/services/client";
import { DashboardLayout } from "@/components/dashboard-layout";
import { createSubmission } from "@/lib/services/submissions";

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
const formSchema = z.object({
  activity_stream: z.string().min(1, "Activity type is required"),
  specific_location: z.string().min(1, "Location is required"),
  community_group_type: z.string().min(1, "Community group type is required"),
  participant_count: z.coerce
    .number({ invalid_type_error: "Participant count must be a number" })
    .int("Participant count must be a whole number")
    .positive("Number of participants must be positive")
    .min(1, "At least one participant is required"),
  key_issues: z
    .string()
    .min(10, "Please provide more details about key issues discussed (min 10 characters)"),
  images: z
    .array(z.string().url("Invalid image URL"))
    .min(1, "At least one photo is required as evidence")
    .optional(),
  project_id: z.string().min(1, "Project is required"),
  promoter_id: z.string().min(1, "Promoter is required"), // Add promoter_id field
  pre_session_dfs_level: z.string().optional(),
  post_session_dfs_improvement: z.string().optional(),
  estimated_dfs_adoption_count: z.coerce
    .number({ invalid_type_error: "Estimated adoption count must be a number" })
    .int("Estimated adoption count must be a whole number")
    .nonnegative("Estimated adoption count cannot be negative")
    .optional(),
});

interface ProjectData {
  project_id: string;
  projects: {
    id: string;
    name: string;
  } | null;
}

// Add interface for Promoter data
interface PromoterData {
  id: string;
  name: string;
}

// Interface for Project Assignments (adjust if your schema differs)
interface ProjectAssignment {
  user_id: string; // Promoter's ID
  project_id: string;
  projects: { // Assuming 'projects' is the related table name
    id: string;
    name: string;
  } | null;
}


export default function NewSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  // State for all project assignments and filtered ones
  const [allProjectAssignments, setAllProjectAssignments] = useState<ProjectAssignment[]>([]);
  const [filteredProjectsForSelectedPromoter, setFilteredProjectsForSelectedPromoter] = useState<ProjectAssignment[]>([]);
  // State for promoters (using PromoterData interface) and selected promoter ID
  const [promoters, setPromoters] = useState<PromoterData[]>([]); // Changed from string[]
  const [selectedPromoterId, setSelectedPromoterId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activity_stream: "",
      specific_location: "",
      community_group_type: "",
      participant_count: undefined,
      key_issues: "",
      images: undefined,
      project_id: "",
      promoter_id: "", // Ensure default value exists
      pre_session_dfs_level: "",
      post_session_dfs_improvement: "",
      estimated_dfs_adoption_count: undefined,
    },
  });

  // Combined useEffect for initial data loading (Promoters and Project Assignments)
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch Promoters
        const { data: promotersData, error: promotersError } = await supabase
          .from('users')
          .select('id, name')
          .eq('role', 'promoter')
          .order('name', { ascending: true });

        if (promotersError) throw promotersError;

        const validPromoters = (promotersData || [])
          .filter((p: any) => !!p && !!p.id && !!p.name)
          .map((p: any) => ({ id: String(p.id), name: String(p.name) }));

        setPromoters(validPromoters);

        // Fetch All Project Assignments
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

      } catch (error: any) {
        console.error("Error loading initial data:", error);
        toast({
          title: "Error Loading Data",
          description: error.message || "Failed to load promoters or project assignments.",
          variant: "destructive",
        });
        setPromoters([]);
        setAllProjectAssignments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [supabase, toast]);

  // useEffect to filter projects when selectedPromoterId changes
  useEffect(() => {
    if (selectedPromoterId) {
      const promoterProjects = allProjectAssignments.filter(
        (assignment) => assignment.user_id === selectedPromoterId
      );
      setFilteredProjectsForSelectedPromoter(promoterProjects);
      // Reset project_id field when promoter changes
      form.resetField("project_id", { defaultValue: "" });
    } else {
      setFilteredProjectsForSelectedPromoter([]); // Clear projects if no promoter is selected
      form.resetField("project_id", { defaultValue: "" }); // Also reset if promoter is deselected
    }
  }, [selectedPromoterId, allProjectAssignments, form]);

  const handleImageUpload = (url: string) => {
    if (!url) return;
    const currentImages = form.getValues("images") || [];
    form.setValue("images", [...currentImages, url], { shouldValidate: true });
    setUploadedImageUrl(url);
  };

  const handleImageRemove = (urlToRemove?: string) => {
    const currentImages = form.getValues("images") || [];
    let updatedImages = [...currentImages];

    if (urlToRemove) {
      updatedImages = updatedImages.filter(url => url !== urlToRemove);
    } else if (updatedImages.length > 0) {
      updatedImages.pop();
    }

    form.setValue("images", updatedImages, { shouldValidate: true });

    if (updatedImages.length > 0) {
      setUploadedImageUrl(updatedImages[updatedImages.length - 1]);
    } else {
      setUploadedImageUrl("");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    // Keep userProfile check for potential authorization, but don't use its ID for submitted_by
    if (!userProfile?.id) {
      toast({
        title: "Authentication Error",
        description: "User profile not found. Please log in again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const imagesArray = values.images || [];
    if (formSchema.shape.images && 'min' in formSchema.shape.images && imagesArray.length < (formSchema.shape.images as any)._def.checks.find((check: any) => check.kind === 'min')?.value) {
      toast({
        title: "Validation Error",
        description: "At least one photo is required.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const submissionTimeout = setTimeout(() => {
      console.error("Submission timeout occurred.");
      setIsSubmitting(false);
      toast({
        title: "Submission Timeout",
        description: "The submission process took too long. Please check your connection and try again.",
        variant: "destructive",
      });
    }, 45000);

    try {
      const submissionData = {
        activity_stream: values.activity_stream,
        specific_location: values.specific_location,
        community_group_type: values.community_group_type,
        participant_count: values.participant_count,
        key_issues: values.key_issues,
        status: "submitted",
        submitted_by: values.promoter_id, // Use the selected promoter_id from form values
        submitted_at: new Date().toISOString(),
        sync_status: "synced",
        project_id: values.project_id,
        pre_session_dfs_level: values.pre_session_dfs_level || null,
        post_session_dfs_improvement: values.post_session_dfs_improvement || null,
        estimated_dfs_adoption_count: values.estimated_dfs_adoption_count ?? null,
      };

      const { data: submissionResultData, error: submissionError } = await createSubmission(submissionData);

      if (submissionError) {
        console.error("Error creating main submission (Supabase Error):", submissionError);
        throw new Error(`Database error: ${submissionError.message}`);
      } else if (!submissionResultData || submissionResultData.length === 0) {
        console.error("Error creating main submission: No data returned after insert operation.");
        throw new Error("Failed to create submission record. The data might not have been saved successfully. Please check permissions or contact support.");
      }

      // If we get here, the submission was successful and data was returned
      const submissionResult = submissionResultData[0];

      const photoInserts = (values.images || []).map((imageUrl) => ({
        submission_id: submissionResult.id,
        photo_url: imageUrl,
      }));

      if (photoInserts.length > 0) {
        const { error: photoError } = await supabase
          .from('submission_photos')
          .insert(photoInserts);

        if (photoError) {
          console.error("Error storing photo references:", photoError);
          toast({
            title: "Warning",
            description: "Submission created, but failed to save photo references. You can edit the submission later to add photos.",
            variant: "default",
          });
        }
      }

      clearTimeout(submissionTimeout);

      toast({
        title: "Submission Successful",
        description: "Field data has been recorded successfully for the selected promoter.",
      });
      router.push("/dashboard");

    } catch (error: any) {
      clearTimeout(submissionTimeout);
      console.error("Error during submission process:", error);
      toast({
        title: "Submission Failed",
        description: `Could not create submission. ${error.message || "An unknown error occurred. Please try again."}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    let submissionTimeout: NodeJS.Timeout;
    if (isSubmitting) {
      submissionTimeout = setTimeout(() => {
        console.error("Submission timeout occurred.");
        setIsSubmitting(false);
        toast({
          title: "Submission Timeout",
          description: "The submission process took too long. Please check your connection and try again.",
          variant: "destructive",
        });
      }, 45000);
    }

    return () => {
      if (submissionTimeout) {
        clearTimeout(submissionTimeout);
      }
    };
  }, [isSubmitting, toast]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Add check for missing promoters after loading
  if (!isLoading && promoters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[calc(100vh-10rem)]">
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          No promoters found in the system. Please add promoter users first before creating submissions.
        </p>
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
          aria-label="Go back"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">New Field Submission</h1>
        <p className="text-muted-foreground mt-1">
          Record field data from your community engagement activities.
        </p>
      </div>

      <Card className="border shadow-sm overflow-hidden">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4 border-b pb-6">
                <h2 className="text-lg font-semibold text-primary">Basic Information</h2>
                
                {/* Promoter Selection Field - Added at the top */}
                <FormField
                  control={form.control}
                  name="promoter_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submitted By (Promoter)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value); // Update form state
                          setSelectedPromoterId(value); // Update local state to trigger project filtering
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
                        Select the promoter who collected the data. This will filter the available projects.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="activity_stream"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select an activity type" />
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
                        <FormLabel>Specific Location / Venue</FormLabel>
                        <FormControl>
                          <Input type="text" placeholder="e.g., Kebele Hall, Market Square" className="h-10" {...field} />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select the group type engaged" />
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
                  <FormField
                    control={form.control}
                    name="estimated_dfs_adoption_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated DFS Adoption Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
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
                
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedPromoterId || isLoading || filteredProjectsForSelectedPromoter.length === 0}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder={
                              isLoading ? "Loading..." :
                              !selectedPromoterId ? "Select a promoter first" :
                              filteredProjectsForSelectedPromoter.length === 0 ? "No projects for this promoter" :
                              "Select assigned project"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoading && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                          {!isLoading && !selectedPromoterId && <SelectItem value="-" disabled>Select promoter</SelectItem>}
                          {!isLoading && selectedPromoterId && filteredProjectsForSelectedPromoter.length === 0 && <SelectItem value="-" disabled>No projects found</SelectItem>}
                          {filteredProjectsForSelectedPromoter.map((proj) => (
                            <SelectItem key={proj.project_id} value={proj.project_id}>
                              {proj.projects?.name || `Project ID: ${proj.project_id.substring(0, 8)}...`}
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
                  name="pre_session_dfs_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pre-session DFS Awareness, Trust and Confidence level of participants</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select pre-session level" />
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

              <div className="space-y-4 border-b pb-6">
                <h2 className="text-lg font-semibold text-primary">Session Details</h2>
                <FormField
                  control={form.control}
                  name="key_issues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key Issues / Takeaways / Observations</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe key discussion points, questions asked, participant feedback, challenges, and overall session outcomes..."
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a comprehensive summary of the engagement. (Min 10 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-primary">Photo Evidence</h2>
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem>
                      <div className="bg-muted/30 border border-dashed rounded-lg p-4 md:p-6">
                        <FormControl>
                          <div className="max-w-md mx-auto">
                            <ImageUpload
                              value={uploadedImageUrl}
                              onUpload={handleImageUpload}
                              onRemove={handleImageRemove}
                            />
                          </div>
                        </FormControl>
                        <div className="mt-4 text-sm text-center">
                          {field.value && field.value.length > 0 ? (
                            <span className="font-medium text-green-600">
                              {field.value.length} photo{field.value.length !== 1 ? "s" : ""} uploaded.
                            </span>
                          ) : (
                            <span className="text-muted-foreground flex items-center justify-center">
                              <Camera className="h-4 w-4 mr-1.5" />
                              {formSchema.shape.images && 'min' in formSchema.shape.images && (formSchema.shape.images as any)._def.checks.find((check: any) => check.kind === 'min')?.value > 0
                                ? `At least ${(formSchema.shape.images as any)._def.checks.find((check: any) => check.kind === 'min')?.value} photo(s) required.`
                                : "Upload photo evidence."
                              }
                            </span>
                          )}
                        </div>
                        <FormMessage className="text-center mt-2" />
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t flex flex-col sm:flex-row sm:justify-end gap-3 mt-4">
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
                  disabled={isSubmitting || !form.formState.isValid || isLoading || promoters.length === 0 || !selectedPromoterId || filteredProjectsForSelectedPromoter.length === 0}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="mr-2 h-4 w-4 border-white/80" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Data"
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