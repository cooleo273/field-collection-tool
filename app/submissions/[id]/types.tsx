import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react"
import React from "react"
import { z } from "zod"

export interface Submission {
  id: string
  activity_stream: string
  location: string
  community_group_type: string
  participant_count: number
  key_issues: string
  status: string
  submitted_by: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  sync_status: string
  created_at: string
  updated_at: string
  // Join data
  campaigns?: { name: string }
  locations?: { name: string }
  users?: { name: string, email: string }
}
export const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="px-3 py-1 text-sm font-medium" variant="outline">Draft</Badge>
      case "submitted":
        return <Badge className="px-3 py-1 text-sm font-medium" variant="secondary">Submitted</Badge>
      case "approved":
        return <Badge className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>
      case "rejected":
        return <Badge className="px-3 py-1 text-sm font-medium" variant="destructive">Rejected</Badge>
      default:
        return <Badge className="px-3 py-1 text-sm font-medium" variant="outline">{status}</Badge>
    }
  }

  export const getStatusIcon = (status: string) => {
      switch (status) {
        case "approved":
          return <CheckCircle className="h-12 w-12 text-green-500" />
        case "rejected":
          return <XCircle className="h-12 w-12 text-red-500" />
        case "submitted":
          return <Clock className="h-12 w-12 text-blue-500" />
        default:
          return <AlertTriangle className="h-12 w-12 text-amber-500" />
      }
    }
  export const COMMUNITY_GROUPS = [
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
  export const ACTIVITY_STREAM = [
    "Training",
    "Workshop",
    "Mass Awareness",
    "DFS Brief",
    "Panel Discussion",
    "IEC Material Distribution",
    "BroadCast Monitoring",
  ];
  
  // Form schema
  export const formSchema = z.object({
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
  });