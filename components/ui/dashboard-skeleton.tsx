import React from 'react'

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-muted rounded-lg p-6">
            <div className="h-8 w-32 bg-muted-foreground/20 rounded mb-2" />
            <div className="h-4 w-24 bg-muted-foreground/20 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
