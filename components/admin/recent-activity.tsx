import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/utils"

interface RecentActivityProps {
  extended?: boolean
}

export function RecentActivity({ extended = false }: RecentActivityProps) {
  // In a real app, this would fetch from the API
  const activities = [
    {
      id: "1",
      user: {
        id: "3",
        name: "Promoter User",
        role: "promoter",
      },
      action: "submitted",
      target: "Women's Association session",
      date: new Date("2023-04-10T14:30:00"),
    },
    {
      id: "2",
      user: {
        id: "2",
        name: "Project Admin",
        role: "project-admin",
      },
      action: "approved",
      target: "Farmers Association session",
      date: new Date("2023-04-09T11:15:00"),
    },
    {
      id: "3",
      user: {
        id: "1",
        name: "Admin User",
        role: "admin",
      },
      action: "created",
      target: "new campaign: Water Sanitation Program",
      date: new Date("2023-04-08T09:45:00"),
    },
    {
      id: "4",
      user: {
        id: "2",
        name: "Project Admin",
        role: "project-admin",
      },
      action: "rejected",
      target: "Health Volunteers session",
      date: new Date("2023-04-07T16:20:00"),
    },
    {
      id: "5",
      user: {
        id: "1",
        name: "Admin User",
        role: "admin",
      },
      action: "added",
      target: "new user: John Doe (Promoter)",
      date: new Date("2023-04-06T10:30:00"),
    },
  ]

  const getActionColor = (action: string) => {
    switch (action) {
      case "submitted":
        return "text-blue-600"
      case "approved":
        return "text-green-600"
      case "rejected":
        return "text-red-600"
      case "created":
      case "added":
        return "text-purple-600"
      default:
        return "text-gray-600"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
  }

  return (
    <div className="space-y-4">
      {activities.slice(0, extended ? undefined : 3).map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-sm">
              <span className="font-medium">{activity.user.name}</span>{" "}
              <span className={getActionColor(activity.action)}>{activity.action}</span> <span>{activity.target}</span>
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(activity.date)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

