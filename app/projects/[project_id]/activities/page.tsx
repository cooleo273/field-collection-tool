"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Plus, Pencil, Trash2, Calendar } from "lucide-react"
import { getCampaigns, createCampaign, deleteCampaign, Campaign, getCampaignById } from "@/lib/services/campaigns"
import { getAdminCampaigns } from "@/lib/services/campaign-admins"
import { formatDate } from "@/lib/utils"
import { AddCampaignDialog } from "@/components/admin/add-campaign-dialog"
import { EditCampaignDialog } from "@/components/admin/edit-campaign-dialog"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useProject } from "@/contexts/project-context"

export default function ProjectActivitiesPage() {
  const params = useParams()
  const projectId = params.project_id as string
  const { userProfile } = useAuth()
  const { currentProject, setCurrentProject, refreshProjectFromStorage } = useProject()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  
  // Effect to sync with URL project ID
  useEffect(() => {
    if (!projectId) return;
    
    // Get the current localStorage value
    const currentStoredId = typeof window !== 'undefined' ? 
      localStorage.getItem('selectedProjectId') : null;
    
    // If URL doesn't match localStorage, update URL to match localStorage
    if (currentStoredId && currentStoredId !== projectId) {
       ("URL doesn't match localStorage, redirecting to correct project");
      window.location.href = `/projects/${currentStoredId}/activities`;
      return;
    }
    
    // If localStorage doesn't match URL, update localStorage to match URL
    if (projectId && (!currentStoredId || currentStoredId !== projectId)) {
       ("localStorage doesn't match URL, updating localStorage");
      localStorage.setItem('selectedProjectId', projectId);
      refreshProjectFromStorage();
    }
    
    // If current project doesn't match URL, refresh from storage
    if (!currentProject || currentProject.id !== projectId) {
       ("Current project doesn't match URL, refreshing from storage");
      refreshProjectFromStorage();
    }
  }, [projectId, currentProject, refreshProjectFromStorage]);

  const loadCampaigns = async () => {
    if (!projectId) {
      console.error("No project ID found in URL")
      toast({
        title: "Error loading activities",
        description: "Project ID is missing. Please ensure you're accessing this page correctly.",
        variant: "destructive",
      })
      return
    }
    if (!userProfile) return
    setLoading(true)
    try {
      let campaignsData: Campaign[] = [];
      
      if (userProfile.role === 'admin') {
        // If user is admin, get all campaigns
        campaignsData = await getCampaigns();
      } else {
        try {
          // If user is not admin, get campaigns assigned to them
          const adminCampaigns = await getAdminCampaigns(userProfile.id);
          
          if (adminCampaigns && Array.isArray(adminCampaigns) && adminCampaigns.length > 0) {
            // Properly extract campaign data from admin campaigns
            const campaignPromises = adminCampaigns.map(async (adminCampaign) => {
              if (adminCampaign.campaign_id) {
                try {
                  return await getCampaignById(adminCampaign.campaign_id);
                } catch (err) {
                  console.error(`Error fetching campaign ${adminCampaign.campaign_id}:`, err);
                  return null;
                }
              }
              return null;
            });
            
            const campaignResults = await Promise.all(campaignPromises);
            campaignsData = campaignResults.filter(Boolean) as Campaign[];
          }
        } catch (error) {
          console.error("Error fetching admin campaigns:", error);
          toast({
            title: "Error loading assigned activities",
            description: "There was a problem loading your assigned activities. Trying to load all activities instead.",
            variant: "destructive",
          });
          
          // Fallback to getting all campaigns if admin campaigns fetch fails
          try {
            campaignsData = await getCampaigns();
          } catch (fallbackError) {
            console.error("Fallback error:", fallbackError);
          }
        }
      }
    } catch (error) {
      console.error("Error loading activities:", error)
      toast({
        title: "Error loading activities",
        description: "There was a problem loading the activities list. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load campaigns when user profile or project ID changes
  useEffect(() => {
    if (userProfile && projectId) {
      loadCampaigns()
    }
  }, [userProfile, projectId])

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedCampaign) return

    try {
      await deleteCampaign(selectedCampaign.id)
      toast({
        title: "Activity deleted",
        description: `${selectedCampaign.name} has been removed successfully.`,
      })
      loadCampaigns()
    } catch (error) {
      console.error("Error deleting activity:", error)
      toast({
        title: "Error deleting activity",
        description: "There was a problem deleting the activity. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedCampaign(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "archived":
        return <Badge variant="outline">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Activities</h1>
          <p className="page-description">Manage field activities for your campaigns</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Activity
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Field Activities</CardTitle>
          <Calendar className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-10">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-muted">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-lg font-medium">No activities found</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Add your first activity to start collecting field data
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first activity
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="data-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>{campaign.description}</TableCell>
                      <TableCell>{formatDate(campaign.start_date)}</TableCell>
                      <TableCell>{formatDate(campaign.end_date)}</TableCell>
                      <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Campaign Dialog */}
      <AddCampaignDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={loadCampaigns}
      />

      {/* Edit and Delete Dialogs */}
      {selectedCampaign && (
        <>
          <EditCampaignDialog
            campaign={selectedCampaign}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={loadCampaigns}
          />
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the Activity
                  "{selectedCampaign.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  )
}

