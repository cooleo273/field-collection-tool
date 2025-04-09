"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"
import { getPendingSubmissions, updateSubmissionSyncStatus } from "@/lib/offline-storage"
import { createSubmission } from "@/lib/mock-data/submissions"
import { CheckCircle, CloudOff, RefreshCw, AlertCircle } from "lucide-react"

export default function SyncPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncedCount, setSyncedCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check online status
  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      // Only promoters should access this page
      if (parsedUser.role !== "promoter") {
        router.push("/dashboard")
      } else {
        setIsOnline(navigator.onLine)
        checkPendingSubmissions()
        setLoading(false)
      }
    } else {
      router.push("/")
    }

    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", handleOnlineStatus)
    window.addEventListener("offline", handleOnlineStatus)

    return () => {
      window.removeEventListener("online", handleOnlineStatus)
      window.removeEventListener("offline", handleOnlineStatus)
    }
  }, [router])

  // Check for pending submissions
  const checkPendingSubmissions = async () => {
    try {
      const pendingSubmissions = await getPendingSubmissions()
      setPendingCount(pendingSubmissions.length)
    } catch (error) {
      console.error("Error checking pending submissions:", error)
    }
  }

  // Sync data with server
  const syncData = async () => {
    if (!isOnline) {
      toast({
        title: "You're offline",
        description: "Please connect to the internet to sync your data.",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    setSyncedCount(0)
    setProgress(0)

    try {
      const pendingSubmissions = await getPendingSubmissions()
      setPendingCount(pendingSubmissions.length)

      if (pendingSubmissions.length === 0) {
        toast({
          title: "No pending submissions",
          description: "All your data is already synced.",
        })
        setIsSyncing(false)
        return
      }

      // Process each submission
      for (let i = 0; i < pendingSubmissions.length; i++) {
        const submission = pendingSubmissions[i]

        // In a real app, this would send the submission to the server
        await createSubmission(submission)

        // Update sync status
        await updateSubmissionSyncStatus(submission.id, "synced")

        // Update progress
        setSyncedCount(i + 1)
        setProgress(Math.round(((i + 1) / pendingSubmissions.length) * 100))

        // Add a small delay to simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      toast({
        title: "Sync complete",
        description: `Successfully synced ${pendingSubmissions.length} submissions.`,
      })

      // Refresh pending count
      await checkPendingSubmissions()
    } catch (error) {
      console.error("Error syncing data:", error)
      toast({
        title: "Sync failed",
        description: "An error occurred while syncing your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Sync Data</h1>
        <p className="text-muted-foreground">Synchronize your offline submissions with the server</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization</CardTitle>
          <CardDescription>Sync your locally saved submissions when you have internet connectivity</CardDescription>
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
                <span>
                  {syncedCount} of {pendingCount}
                </span>
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
          <Button onClick={syncData} disabled={!isOnline || isSyncing || pendingCount === 0}>
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
  )
}

