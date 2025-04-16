"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import { Eye, Edit, Upload, Filter } from "lucide-react"
import { format } from "date-fns"

// Updated interface to match the database schema
interface Submission {
  id: string
  campaign_id: string
  location_id: string
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
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { userProfile } = useAuth()
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!userProfile) return

    const fetchSubmissions = async () => {
      try {
        // Updated query to match the schema and include related data
        const { data, error } = await supabase
          .from("submissions")
          .select(`
            *
          `)
          .eq("submitted_by", userProfile.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        setSubmissions(data || [])
      } catch (error) {
        console.error("Error fetching submissions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmissions()

    // Set up real-time subscription with corrected field name
    const subscription = supabase
      .channel("submissions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
          filter: `submitted_by=eq.${userProfile.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSubmissions((prev) => [payload.new as Submission, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setSubmissions((prev) =>
              prev.map((submission) => (submission.id === payload.new.id ? (payload.new as Submission) : submission)),
            )
          } else if (payload.eventType === "DELETE") {
            setSubmissions((prev) => prev.filter((submission) => submission.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userProfile, supabase])

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "status-badge-success"
      case "submitted":
        return "status-badge-warning"
      case "rejected":
        return "status-badge-error"
      case "draft":
        return "status-badge-info"
      default:
        return "status-badge-info"
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="page-title">My Submissions</h1>
            <p className="page-description">View and manage your field data submissions</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button asChild>
              <Link href="/submissions/new">
                <Upload className="mr-2 h-4 w-4" />
                New Submission
              </Link>
            </Button>
          </div>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="mb-4 text-center text-muted-foreground">No submissions found</p>
              <Button asChild>
                <Link href="/submissions/new">Create your first submission</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id} className="mobile-card">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{submission.community_group_type}</h3>
                    <span className={getStatusBadgeClass(submission.status)}>{submission.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Location: {submission.locations?.name || 'Unknown'}</p>
                    <p>Campaign: {submission.campaigns?.name || 'Unknown'}</p>
                    <p>Participants: {submission.participant_count}</p>
                    <p>Date: {format(new Date(submission.created_at), "PPP")}</p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/submissions/${submission.id}`}>
                        <Eye className="mr-1 h-3 w-3" /> View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <Link href={`/submissions/edit/${submission.id}`}>
                        <Edit className="mr-1 h-3 w-3" /> Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

