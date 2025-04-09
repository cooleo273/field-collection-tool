import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function SubmissionsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions Overview</CardTitle>
        <CardDescription>Monthly submission trends</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Submissions chart would go here</p>
        </div>
      </CardContent>
    </Card>
  )
}

