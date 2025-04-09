import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function CampaignsOverview() {
  // In a real app, this would fetch from the API
  const campaignStats = {
    total: 6,
    active: 4,
    completed: 1,
    draft: 1,
    submissions: 147,
    participants: 2350,
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
            <Badge>{campaignStats.total}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.total}</div>
            <p className="text-xs text-muted-foreground">All campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Badge variant="success">{campaignStats.active}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.active}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Badge variant="secondary">{campaignStats.completed}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Badge variant="outline">{campaignStats.draft}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.draft}</div>
            <p className="text-xs text-muted-foreground">In preparation</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>Submissions and participants by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Campaign performance chart would go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

