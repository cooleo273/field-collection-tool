export interface DashboardStats {
  submissions: number
  pendingSubmissions: number
  locations: number
}

export interface Project {
  id: string
  name: string
}

export interface SubmissionTrendData {
  date: string
  count: number
}

export interface StatusDistributionData {
  name: string
  value: number
  color: string
}
