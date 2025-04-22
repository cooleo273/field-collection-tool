"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckedState } from "@radix-ui/react-checkbox"
import { Campaign } from "@/lib/services/campaigns.service"
import { fetchAllCampaigns, fetchCampaignById } from "@/lib/repositories/campaign.repository"

const formSchema = z.object({
  campaignIds: z.array(z.string()),
})

type FormValues = z.infer<typeof formSchema>

interface AssignCampaignsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  admin: any
}

export function AssignCampaignsDialog({
  open,
  onOpenChange,
  onSuccess,
  admin,
}: AssignCampaignsDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [assignedCampaignIds, setAssignedCampaignIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaignIds: [],
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open, admin.id])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load all campaigns
      const campaignsData = await fetchAllCampaigns()
      setCampaigns(campaignsData)

      // Load admin's assigned campaigns
      const adminCampaigns = await fetchCampaignById(admin.id)
      const assignedIds = adminCampaigns.map(ac => ac.campaign_id)
      setAssignedCampaignIds(assignedIds)
      
      // Set form values
      form.setValue('campaignIds', assignedIds)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load campaigns data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      await assignCampaignsToAdmin(admin.id, values.campaignIds)
      toast({
        title: "Success",
        description: "Campaigns assigned successfully",
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error assigning campaigns:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign campaigns",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCheckboxChange = (campaignId: string, checked: CheckedState) => {
    const currentIds = form.getValues().campaignIds
    let newIds: string[]
    
    if (checked) {
      newIds = [...currentIds, campaignId]
    } else {
      newIds = currentIds.filter(id => id !== campaignId)
    }
    
    form.setValue('campaignIds', newIds, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Campaigns</DialogTitle>
          <DialogDescription>
            Assign campaigns to {admin.name}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-6">
                <p className="text-muted-foreground">Loading campaigns...</p>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="campaignIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Campaigns</FormLabel>
                    <ScrollArea className="h-[300px] border rounded-md p-4">
                      <div className="space-y-4">
                        {campaigns.length > 0 ? (
                          campaigns.map((campaign) => (
                            <div key={campaign.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`campaign-${campaign.id}`}
                                defaultChecked={assignedCampaignIds.includes(campaign.id)}
                                onCheckedChange={(checked) => handleCheckboxChange(campaign.id, checked)}
                              />
                              <label 
                                htmlFor={`campaign-${campaign.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
                              >
                                {campaign.name}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No campaigns available</p>
                        )}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? "Saving..." : "Save Assignments"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 