"use client";

// cSpell:ignore Idir Iquib

import { useState, useEffect } from "react";
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
import { ImageUpload } from "@/components/image-upload"; // Assuming this component handles single/multiple uploads based on interaction
import { LoadingSpinner } from "@/components/loading-spinner";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Camera } from "lucide-react";
import { supabase } from "@/lib/services/client"; // Assuming Supabase client setup
import { DashboardLayout } from "@/components/dashboard-layout"; // Assuming this layout component exists
import { createSubmission } from "@/lib/services/submissions"; // Assuming this service function exists
// import { useProject } from '@/contexts/project-context'; // Project context is not used directly here anymore for default value, but might be needed elsewhere

// Constants for Select options
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

// Zod schema for form validation
const formSchema = z.object({
  activity_stream: z.string().min(1, "Activity is required"),
  specific_location: z.string().min(1, "Location is required"),
  community_group_type: z.string().min(1, "Community group type is required"),
  participant_count: z.coerce
    .number()
    .int()
    .positive("Number of participants must be positive")
    .min(1, "At least one participant is required"),
  key_issues: z
    .string()
    .min(10, "Please provide more details about key issues discussed (min 10 characters)"),
  images: z
    .array(z.string().url("Invalid image URL")).optional(), // Validate that images are URLs and make it optional
  project_id: z.string().min(1, "Project is required"), // Ensure project_id is a non-empty string (like UUID)
});

// Type definition for fetched projects (adjust based on actual Supabase response)
interface ProjectData {
    project_id: string;
    projects: {
        id: string;
        name: string;
    } | null; // Handle potential null relationship data
}


export default function NewSubmissionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile } = useAuth();
  // const { currentProject } = useProject(); // Keep if needed for other logic, but not for default value setting here
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for initial data fetching
//   const [campaigns, setCampaigns] = useState<any[]>([]); // State for campaigns removed as per previous logic
  const [uploadedImageUrl, setUploadedImageUrl] = useState(""); // State potentially for the *last* uploaded image URL shown in ImageUpload preview
  const [filteredProjects, setFilteredProjects] = useState<ProjectData[]>([]); // State to hold fetched projects assigned to the user


  // Initialize react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activity_stream: "",
      specific_location: "",
      community_group_type: "",
      participant_count: undefined, // Use undefined for number inputs initially
      key_issues: "",
      images: undefined, // Set default to undefined for optional field
      project_id: "", // Initialize project_id as empty
    },
  });

  // Effect to load projects assigned to the current user
  useEffect(() => {
    const loadProjects = async () => {
      if (!userProfile?.id) {
          setIsLoading(false); // Stop loading if no user ID
          return;
      };

      setIsLoading(true);
      try {
        // Fetch projects assigned to the user from project_promoters table
        // Ensure 'projects' is the correct related table name and 'name' is the column in 'projects' table
        const { data: projectsData, error } = await supabase
          .from('project_promoters')
          .select('project_id, projects (id, name)') // Adjust selection as needed
          .eq('user_id', userProfile.id);

        if (error) {
          console.error("Error fetching projects:", error);
          throw new Error(error.message || "Database error fetching projects.");
        }

        // Ensure the `projects` property is correctly treated as a single object
        const formattedProjects = (projectsData || []).map((project) => ({
            project_id: project.project_id,
            projects: Array.isArray(project.projects) ? project.projects[0] : project.projects, // Handle array case
        }));

        setFilteredProjects(formattedProjects);

      } catch (error: any) {
        console.error("Error loading projects:", error);
        toast({
          title: "Error Loading Projects",
          description: error.message || "Failed to load assigned projects. Please refresh.",
          variant: "destructive",
        });
         setFilteredProjects([]); // Ensure state is empty on error
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [userProfile?.id, toast]); // Depend only on userProfile.id and toast

  // Effect to set the default project selection once projects are loaded
  useEffect(() => {
    // Check if projects have been loaded and the array is not empty
    if (filteredProjects.length > 0) {
      // Check if the project_id field hasn't already been set (e.g., by user interaction)
      // This prevents overriding a user's manual selection if the project list reloads
      if (!form.getValues("project_id")) {
        const firstProjectId = filteredProjects[0].project_id;
        form.setValue("project_id", firstProjectId, { shouldValidate: true });
      }
    }
    // This depends on the fetched projects and the form instance
  }, [filteredProjects, form]);

  // Handler for successful image upload from ImageUpload component
  // Assumes ImageUpload calls this with the *public URL* of the uploaded image
  const handleImageUpload = (url: string) => {
    if (!url) return;
    const currentImages = form.getValues("images") || []; // Default to empty array
    // Add the new URL to the form state array
    form.setValue("images", [...currentImages, url], { shouldValidate: true });
    // Optionally update a preview state if ImageUpload needs it
    setUploadedImageUrl(url); // This might just show the *last* uploaded image preview
  };

  // Handler for removing an image
  // NOTE: This basic implementation removes the *last* added image URL from the form state.
  // A more robust implementation would need the ImageUpload component to provide which URL to remove.
  const handleImageRemove = (/* urlToRemove?: string */) => {
    // Reset the preview state (if used)
    setUploadedImageUrl("");
    const currentImages = form.getValues("images") || []; // Default to empty array
    if (currentImages.length > 0) {
        // Basic: Remove the last element. Needs improvement for specific removal.
        form.setValue("images", currentImages.slice(0, -1), { shouldValidate: true });
    }
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    if (!userProfile?.id) {
      toast({
        title: "Authentication Error",
        description: "User profile not found. Please log in again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Submission timeout (optional, prevents indefinite loading state)
    const submissionTimeout = setTimeout(() => {
      console.error("Submission timeout occurred.");
      setIsSubmitting(false);
      toast({
        title: "Submission Timeout",
        description: "The submission process took too long. Please check your connection and try again.",
        variant: "destructive",
      });
    }, 45000); // 45 seconds timeout

    try {
      // 1. Create the main submission record
      const submissionData = {
        activity_stream: values.activity_stream,
        specific_location: values.specific_location,
        community_group_type: values.community_group_type,
        participant_count: values.participant_count,
        key_issues: values.key_issues,
        status: "submitted", // Set status directly to submitted (or 'draft' if review needed)
        submitted_by: userProfile.id,
        submitted_at: new Date().toISOString(),
        sync_status: "pending", // Or 'synced' if directly sending to backend
        project_id: values.project_id,
        // Add title if needed/generated: title: `Submission for ${values.activity_stream}`
      };

      // Assuming createSubmission handles inserting into the 'submissions' table
      const submissionResult = await createSubmission(submissionData);

      if (!submissionResult || !submissionResult.id) {
          throw new Error("Failed to create main submission record.");
      }

      // 2. Store photo URLs in the related 'submission_photos' table
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
          // Decide if this is a critical error. Maybe warn the user but proceed?
          toast({
            title: "Warning",
            description: "Submission created, but failed to save photo references. Please edit the submission later.",
            variant: "default", // Use default variant for warnings
          });
        }
      }

      // Clear the timeout upon successful completion
      clearTimeout(submissionTimeout);

      toast({
        title: "Submission Successful",
        description: "Your data has been recorded successfully.",
      });
      router.push("/submissions"); // Redirect to submissions list page

    } catch (error: any) {
      clearTimeout(submissionTimeout); // Clear timeout on error too
      console.error("Error creating submission:", error);
      toast({
        title: "Submission Failed",
        description: `Could not create submission. ${error.message || "Please try again."}`,
        variant: "destructive",
      });
    } finally {
      // Only set isSubmitting to false *after* timeout is cleared and logic completes
      // The timeout itself also sets it to false if it triggers
      if (!submissionTimeout) { // Check if timeout hasn't already set it
          setIsSubmitting(false);
      }
    }
  };

  // Render loading spinner while fetching initial data
  if (isLoading) {
    return (
      <DashboardLayout> {/* Optional: Show layout shell while loading */}
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // Render the form
  return (
    <DashboardLayout>
      <div className="container max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Page Header */}
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

        {/* Form Card */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8"> {/* Increased spacing */}

                {/* Basic Information Section */}
                <div className="space-y-4 border-b pb-6">
                  <h2 className="text-lg font-semibold text-primary">Basic Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Activity Stream Select */}
                    <FormField
                      control={form.control}
                      name="activity_stream"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Activity Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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

                    {/* Specific Location Input */}
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
                    {/* Community Group Type Select */}
                    <FormField
                      control={form.control}
                      name="community_group_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Community Group Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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

                     {/* Participant Count Input */}
                    <FormField
                      control={form.control}
                      name="participant_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Participants</FormLabel>
                          <FormControl>
                            {/* Use value={field.value || ''} to prevent React controlled/uncontrolled warning */}
                            <Input type="number" min="1" placeholder="Enter total count" className="h-10" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : +e.target.value)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   {/* Project Select */}
                    <FormField
                        control={form.control}
                        name="project_id"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={filteredProjects.length === 0}>
                                    <FormControl>
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder={filteredProjects.length > 0 ? "Select assigned project" : "No projects assigned"} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredProjects.length === 0 && <SelectItem value="-" disabled>No projects available</SelectItem>}
                                        {filteredProjects.map((proj) => (
                                            <SelectItem key={proj.project_id} value={proj.project_id}>
                                                {/* Ensure 'proj.projects.name' exists */}
                                                {proj.projects?.name || `Project ID: ${proj.project_id.substring(0, 8)}...`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Session Details Section */}
                 <div className="space-y-4 border-b pb-6">
                     <h2 className="text-lg font-semibold text-primary">Session Details</h2>
                      {/* Key Issues Textarea */}
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

                 {/* Photo Evidence Section */}
                 <div className="space-y-4">
                     <h2 className="text-lg font-semibold text-primary">Photo Evidence</h2>
                     <FormField
                        control={form.control}
                        name="images" // Ensure this matches the Zod schema field name
                        render={({ field }) => ( // field contains { value, onChange, onBlur, name, ref }
                            <FormItem>
                                {/* Hiding the default FormLabel as ImageUpload might have its own title/prompt */}
                                {/* <FormLabel>Upload Photos</FormLabel> */}
                                <div className="bg-muted/30 border border-dashed rounded-lg p-4 md:p-6">
                                    <FormControl>
                                        {/* Pass necessary props to ImageUpload. It needs to call handleImageUpload on success and handleImageRemove on removal. */}
                                        <div className="max-w-md mx-auto">
                                            <ImageUpload
                                                // value={field.value} // Pass the array of URLs if ImageUpload can display multiple previews
                                                // This component needs clearer props definition: Does it handle multiple files? How does it report URLs back?
                                                // For now, assuming it calls onUpload for each success and onRemove for removal.
                                                // The `uploadedImageUrl` state seems for single preview logic.
                                                value={uploadedImageUrl} // Example: Show preview of last uploaded image
                                                onUpload={handleImageUpload} // Function to call when an image URL is ready
                                                onRemove={handleImageRemove} // Function to call when an image should be removed
                                            />
                                        </div>
                                    </FormControl>

                                    {/* Display count or message */}
                                    <div className="mt-4 text-sm text-center">
                                        {field.value && field.value.length > 0 ? (
                                            <span className="font-medium text-green-600">
                                                {field.value.length} photo{field.value.length !== 1 ? "s" : ""} uploaded.
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground flex items-center justify-center">
                                                <Camera className="h-4 w-4 mr-1.5" />
                                                At least one photo is required as evidence.
                                            </span>
                                        )}
                                    </div>
                                    <FormMessage className="text-center mt-2" /> {/* Centered error message */}
                                </div>
                            </FormItem>
                        )}
                     />
                 </div>

                {/* Submission Actions */}
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
                        disabled={isSubmitting || !form.formState.isValid || isLoading} // Disable if submitting, invalid, or still loading projects
                        className="w-full sm:w-auto order-1 sm:order-2"
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner className="mr-2 h-4 w-4 border-white/80" /> {/* Ensure spinner is visible */}
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
    </DashboardLayout>
  );
}