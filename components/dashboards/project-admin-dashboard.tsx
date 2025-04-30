"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  PieChart,
  Users, 
  FileDown, 
  Map,
  
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getProjectAdminDashboardStats } from "@/lib/services/admin-stats"
import { useAuth } from "@/contexts/auth-context"

// First, let's define interfaces for our data types
interface DashboardStats {
  submissions: number;
  pendingSubmissions: number;
  locations: number;
}

interface SubmissionTrendData {
  date: string;
  count: number;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

interface CampaignPerformanceData {
  name: string;
  value: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentSubmissions: any[];
  submissionTrends: SubmissionTrendData[];
  statusDistribution: StatusDistributionData[];
  campaignPerformance: CampaignPerformanceData[];
}

// Add these imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add this import
import { getAssignedProjects } from "@/lib/services/projects"

// First, let's add the import for useRouter
import { useRouter } from "next/navigation"
// Remove this line
// import router from "next/router"

export function ProjectAdminDashboard() {
  const { userProfile } = useAuth()
  const router = useRouter() // This is correct
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [assignedProjects, setAssignedProjects] = useState<Array<{ id: string; name: string }>>([])
  const [stats, setStats] = useState<DashboardStats>({
    submissions: 0,
    pendingSubmissions: 0,
    locations: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
  const [submissionTrends, setSubmissionTrends] = useState<SubmissionTrendData[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistributionData[]>([])
  
  const handleSubmissionClick = (submissionId: string) => {
  router.push(`/projects/submissions/${submissionId}`)
}
  useEffect(() => {
    if (!userProfile?.id) return
    
    const userId = userProfile.id

    async function loadAssignedProjects() {
      try {
        setLoading(true)
        const projects = await getAssignedProjects(userId)
        
        if (projects.length > 0) {
          setAssignedProjects(projects)
          // Get stored project ID
          const storedProjectId = localStorage.getItem('selectedProjectId')
          // Set stored project if it exists and is valid, otherwise use first project
          if (storedProjectId && projects.some(p => p.id === storedProjectId)) {
            setSelectedProjectId(storedProjectId)
          } else if (!selectedProjectId) {
            setSelectedProjectId(projects[0].id)
          }
        }
      } catch (error) {
        console.error("Error loading assigned projects:", error)
      } finally {
        setLoading(false)
      }
    }

    loadAssignedProjects()
  }, [userProfile]) // Remove selectedProjectId from dependencies

  // Add effect to store selected project
  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem('selectedProjectId', selectedProjectId)
    }
  }, [selectedProjectId])

  useEffect(() => {
    if (!selectedProjectId || !userProfile?.id) return

    async function loadStats() {
      try {
        setLoading(true)
        // Ensure userProfile and selectedProjectId are not null
        if (!userProfile || !selectedProjectId) return
        
        const data = await getProjectAdminDashboardStats(selectedProjectId)
        
        // Add this line to debug the data structure
        console.log("Recent submissions data:", data.recentSubmissions)
        
        setStats(data.stats)
        setRecentSubmissions(data.recentSubmissions)
        setSubmissionTrends(data.submissionTrends)
        setStatusDistribution(data.statusDistribution)
      } catch (error) {
        console.error("Error loading dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [userProfile, selectedProjectId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Project Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {assignedProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <FileDown className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Update the card titles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              In this project
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.locations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Coverage areas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Submission Trends</CardTitle>
                <CardDescription>
                  Submissions over the last 30 days
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {submissionTrends.length > 0 ? (
                  <div className="h-full w-full">
                    <SubmissionTrendsChart data={submissionTrends} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
                    <LineChart className="h-8 w-8 mb-2" />
                    <span>No submission data available</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>
                  Submissions by status
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {statusDistribution.some(item => item.value > 0) ? (
                  <div className="h-full w-full">
                    <StatusDistributionChart data={statusDistribution} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground flex-col">
                    <PieChart className="h-8 w-8 mb-2" />
                    <span>No status data available</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>
                Latest data submitted across your campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {recentSubmissions.map((submission) => (
                    <div 
                      key={submission.id} 
                      className="flex items-center gap-4 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
                      onClick={() => handleSubmissionClick(submission.id)}
                    >
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(submission.status)}`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {submission.title || `${submission.activity_stream}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(submission.created_at)} by {getUserName(submission)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-6">
                  <p className="text-muted-foreground">No recent submissions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Move the function inside the component

// Update chart component type definitions
interface SubmissionTrendsChartProps {
  data: SubmissionTrendData[];
}

function SubmissionTrendsChart({ data }: SubmissionTrendsChartProps) {
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(d => d.count), 1)
  
  return (
    <div className="h-full w-full flex items-end">
      {data.map((day, index) => (
        <div 
          key={day.date} 
          className="flex flex-col items-center flex-1"
          title={`${day.date}: ${day.count} submissions`}
        >
          <div 
            className="w-full bg-primary/80 rounded-t"
            style={{ 
              height: `${(day.count / maxValue) * 100}%`,
              minHeight: day.count > 0 ? '4px' : '0'
            }}
          />
          {index % 5 === 0 && (
            <span className="text-xs mt-2 text-muted-foreground">
              {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

interface StatusDistributionChartProps {
  data: StatusDistributionData[];
}

function StatusDistributionChart({ data }: StatusDistributionChartProps) {

  const transformedData = data.map(item => {
    if (item.name === "submitted") {
        return { ...item, name: "Pending" };
    }
    return item;
  });

  const total = transformedData.reduce((sum, item) => sum + item.value, 0);

  transformedData.forEach((item, index, arr) => {
    const percentage = item.value / total;
    const degrees = percentage * 360;
    const prevPercentage = arr
      .slice(0, index)
      .reduce((sum, prevItem) => sum + (prevItem.value / total), 0);
    const prevDegrees = prevPercentage * 360;

  });

  if (total === 0) {
    console.warn("No data to display in StatusDistributionChart.");
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <span>No data available</span>
      </div>
    );
  }
  
  const gradientSegments = transformedData
    .filter(item => item.value > 0)
    .map((item, index, arr) => {
        const percentage = item.value / total;
        const degrees = percentage * 360;
        const prevPercentage = arr
            .slice(0, index)
            .reduce((sum, prevItem) => sum + (prevItem.value / total), 0);
        const prevDegrees = prevPercentage * 360;

        return `${item.color} ${prevDegrees}deg ${prevDegrees + degrees}deg`;
    })
    .join(", ");

const chartStyle = {
    background: `conic-gradient(${gradientSegments})`,
};

return (
    <div className="h-full w-full flex justify-center items-center">
        <div className="w-48 h-48 relative rounded-full" style={chartStyle}></div>
        <div className="ml-8 space-y-2">
            {transformedData.filter(item => item.value > 0).map(item => (
                <div key={item.name} className="flex items-center">
                    <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}</span>
                </div>
            ))}
        </div>
    </div>
);
}

interface CampaignPerformanceChartProps {
  data: CampaignPerformanceData[];
  showLabels?: boolean;
}

function CampaignPerformanceChart({ data, showLabels = false }: CampaignPerformanceChartProps) {
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="h-full w-full flex flex-col justify-end">
      {data.map((campaign) => (
        <div 
          key={campaign.name} 
          className="flex items-center mb-2"
          title={`${campaign.name}: ${campaign.value} submissions`}
        >
          {showLabels && (
            <div className="w-32 text-sm truncate mr-2">{campaign.name}</div>
          )}
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(campaign.value / maxValue) * 100}%` }}
            />
          </div>
          <span className="ml-2 text-sm">{campaign.value}</span>
        </div>
      ))}
    </div>
  );
} // Ensure this closing brace is added

// Helper function to get the right color class based on submission status
function getStatusColor(status: string) {
  switch (status) {
    case "approved":
      return "bg-green-500"
    case "rejected":
      return "bg-red-500"
    case "submitted":
      return "bg-yellow-500"
    default:
      return "bg-blue-500"
  }
}

// Helper function to format dates
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })
}

// Helper function to get user name from submission
function getUserName(submission: any) {
  if (submission.user_info?.full_name) {
    return submission.user_info.full_name;
  }
  
  if (submission.user_info?.name) {
    return submission.user_info.name;
  }
  
  if (submission.users?.name) {
    return submission.users.name;
  }
  
  if (submission.submitted_by_name) {
    return submission.submitted_by_name;
  }
  
  // If we have the ID but no name, show a shortened version of the ID
  if (submission.submitted_by) {
    return `User ${submission.submitted_by.substring(0, 8)}...`;
  }
  
  return 'Unknown';
}

