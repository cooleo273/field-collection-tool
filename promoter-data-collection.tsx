import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function PromoterDataCollection() {
  return (
    <Tabs defaultValue="form">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="form">Data Collection Form</TabsTrigger>
        <TabsTrigger value="offline">Offline Functionality</TabsTrigger>
        <TabsTrigger value="sync">Data Synchronization</TabsTrigger>
      </TabsList>

      <TabsContent value="form">
        <Card>
          <CardHeader>
            <CardTitle>Promoter Data Collection Form</CardTitle>
            <CardDescription>Form for field data collection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm overflow-auto">
                {`// app/submissions/new/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import { saveSubmissionOffline } from "@/lib/offline-storage";
import { useToast } from "@/components/ui/use-toast";
import { useCommunityGroups, useLocations } from "@/hooks/data-hooks";

// Form validation schema
const formSchema = z.object({
  locationId: z.string().min(1, "Please select an area/kebele"),
  communityGroupId: z.string().min(1, "Please select a community group"),
  communityGroupType: z.string().min(1, "Please select a community group type"),
  participantCount: z.number().min(1, "Must have at least one participant"),
  keyIssues: z.string().min(10, "Please provide key issues or takeaways"),
  photoProof: z.array(z.string()).min(1, "Please upload at least one photo"),
  participants: z.array(
    z.object({
      name: z.string().min(1, "Name is required"),
      gender: z.enum(["male", "female", "other"]),
      age: z.number().min(1, "Age is required"),
      phoneNumber: z.string().optional(),
    })
  ).optional(),
});

export default function NewSubmissionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  
  // Fetch data from hooks (would use mock data in development)
  const { locations } = useLocations();
  const { communityGroups, communityGroupTypes } = useCommunityGroups();
  
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
      participants: [],
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Create submission object
      const submission = {
        id: crypto.randomUUID(),
        ...values,
        status: "draft",
        submittedBy: session?.user?.id || "unknown",
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: "local",
      };
      
      // Save submission to offline storage
      await saveSubmissionOffline(submission);
      
      toast({
        title: "Submission saved",
        description: "Your data has been saved locally and will be synced when online.",
      });
      
      router.push("/submissions");
    } catch (error) {
      console.error("Error saving submission:", error);
      toast({
        title: "Error",
        description: "Failed to save submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>New Field Data Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area/Kebele</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      <ImageUpload 
                        value={field.value} 
                        onChange={field.onChange}
                        maxFiles={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowParticipants(!showParticipants)}
                >
                  {showParticipants ? "Hide" : "Add"} Participant Details
                </Button>
                
                {showParticipants && (
                  <div className="mt-4 border rounded-md p-4">
                    <h3 className="font-medium mb-4">Participant Details</h3>
                    {/* Participant form fields would go here */}
                    <p className="text-sm text-muted-foreground">
                      Note: Participant details can be collected after the campaign.
                    </p>
                  </div>
                )}
              </div>
              
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
                  {isSubmitting ? "Saving..." : "Save Submission"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="offline">
        <Card>
          <CardHeader>
            <CardTitle>Offline Storage Implementation</CardTitle>
            <CardDescription>IndexedDB for offline data persistence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm overflow-auto">
                {`// lib/offline-storage.ts
import { openDB } from 'idb';

// Define database name and version
const DB_NAME = 'akofada-bcc-db';
const DB_VERSION = 1;

// Initialize the database
async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('submissions')) {
        const submissionsStore = db.createObjectStore('submissions', { keyPath: 'id' });
        submissionsStore.createIndex('syncStatus', 'syncStatus');
        submissionsStore.createIndex('submittedBy', 'submittedBy');
      }
      
      if (!db.objectStoreNames.contains('participants')) {
        const participantsStore = db.createObjectStore('participants', { keyPath: 'id' });
        participantsStore.createIndex('submissionId', 'submissionId');
      }
      
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    },
  });
}

// Save submission to IndexedDB
export async function saveSubmissionOffline(submission: any) {
  const db = await initDB();
  await db.put('submissions', submission);
  return submission;
}

// Get all submissions for the current user
export async function getSubmissions(userId: string) {
  const db = await initDB();
  return db.getAllFromIndex('submissions', 'submittedBy', userId);
}

// Get submissions that need to be synced
export async function getPendingSubmissions() {
  const db = await initDB();
  return db.getAllFromIndex('submissions', 'syncStatus', 'local');
}

// Update submission sync status
export async function updateSubmissionSyncStatus(id: string, status: 'local' | 'synced') {
  const db = await initDB();
  const submission = await db.get('submissions', id);
  if (submission) {
    submission.syncStatus = status;
    submission.updatedAt = new Date();
    await db.put('submissions', submission);
  }
  return submission;
}

// Save image to IndexedDB
export async function saveImageOffline(id: string, imageData: string) {
  const db = await initDB();
  await db.put('images', { id, data: imageData });
  return id;
}

// Get image from IndexedDB
export async function getImageOffline(id: string) {
  const db = await initDB();
  return db.get('images', id);
}

// Delete submission from IndexedDB
export async function deleteSubmission(id: string) {
  const db = await initDB();
  await db.delete('submissions', id);
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sync">
        <Card>
          <CardHeader>
            <CardTitle>Data Synchronization</CardTitle>
            <CardDescription>Syncing offline data when online</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm overflow-auto">
                {`// app/submissions/sync/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { getPendingSubmissions, updateSubmissionSyncStatus, getImageOffline } from "@/lib/offline-storage";
import { CheckCircle, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function SyncPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  
  // Check online status
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Initial check
    setIsOnline(navigator.onLine);
    
    // Check pending submissions
    checkPendingSubmissions();
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);
  
  // Check for pending submissions
  const checkPendingSubmissions = async () => {
    try {
      const pendingSubmissions = await getPendingSubmissions();
      setPendingCount(pendingSubmissions.length);
    } catch (error) {
      console.error("Error checking pending submissions:", error);
    }
  };
  
  // Sync data with server
  const syncData = async () => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to sync your data.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSyncing(true);
    setSyncedCount(0);
    setProgress(0);
    
    try {
      const pendingSubmissions = await getPendingSubmissions();
      setPendingCount(pendingSubmissions.length);
      
      if (pendingSubmissions.length === 0) {
        toast({
          title: "No pending submissions",
          description: "All your data is already synced.",
        });
        setIsSyncing(false);
        return;
      }
      
      // Process each submission
      for (let i = 0; i < pendingSubmissions.length; i++) {
        const submission = pendingSubmissions[i];
        
        // Process images first
        const processedImages = [];
        for (const imageId of submission.photoProof) {
          const image = await getImageOffline(imageId);
          if (image) {
            // In a real app, this would upload the image to a server
            // and get back a URL to store in the submission
            processedImages.push(imageId);
          }
        }
        
        // Update submission with processed images
        submission.photoProof = processedImages;
        
        // In a real app, this would send the submission to the server
        // For now, we'll just simulate a successful sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update sync status
        await updateSubmissionSyncStatus(submission.id, 'synced');
        
        // Update progress
        setSyncedCount(i + 1);
        setProgress(Math.round(((i + 1) / pendingSubmissions.length) * 100));
      }
      
      toast({
        title: "Sync complete",
        description: \`Successfully synced \${pendingSubmissions.length} submissions.\`,
      });
      
      // Refresh pending count
      await checkPendingSubmissions();
    } catch (error) {
      console.error("Error syncing data:", error);
      toast({
        title: "Sync failed",
        description: "An error occurred while syncing your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Sync Data</CardTitle>
          <CardDescription>
            Synchronize your offline submissions with the server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isOnline ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <CloudOff className="h-5 w-5 text-amber-500 mr-2" />
              )}
              <span>
                Status: <strong>{isOnline ? "Online" : "Offline"}</strong>
              </span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">
                Pending submissions: <strong>{pendingCount}</strong>
              </span>
            </div>
          </div>
          
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing submissions...</span>
                <span>{syncedCount} of {pendingCount}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
          
          {!isOnline && (
            <div className="bg-amber-50 text-amber-800 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">You're currently offline</p>
                <p className="text-sm">
                  Your submissions are saved locally and will be synced when you're back online.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={syncData}
            disabled={!isOnline || isSyncing || pendingCount === 0}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              "Sync Now"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

