import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function UsersOverview() {
  // In a real app, this would fetch from the API
  const userStats = {
    total: 24,
    admins: 2,
    projectAdmins: 6,
    promoters: 16,
    active: 22,
    inactive: 2,
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Badge>{userStats.total}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Badge variant="secondary">{userStats.admins}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admins}</div>
            <p className="text-xs text-muted-foreground">System administrators</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Admins</CardTitle>
            <Badge variant="secondary">{userStats.projectAdmins}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.projectAdmins}</div>
            <p className="text-xs text-muted-foreground">Campaign managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promoters</CardTitle>
            <Badge variant="secondary">{userStats.promoters}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.promoters}</div>
            <p className="text-xs text-muted-foreground">Field data collectors</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Distribution</CardTitle>
          <CardDescription>Breakdown of users by role and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">User distribution chart would go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

