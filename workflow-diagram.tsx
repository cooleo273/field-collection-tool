import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WorkflowDiagram() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Collection Workflow</CardTitle>
        <CardDescription>Submission, review, and approval process</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-md overflow-auto">
          <pre className="text-sm">
            {`// Workflow diagram showing the data collection process
// This would be implemented in the actual application logic

1. Promoter creates a new submission
   ↓
2. Submission is saved locally (offline-capable)
   ↓
3. When online, submission is synced to the server
   ↓
4. Project Admin receives notification of new submission
   ↓
5. Project Admin reviews submission details
   ↓
6. Project Admin can:
   ├── Approve submission → Submission marked as approved
   │                        ↓
   │                        Analytics updated
   │                        ↓
   │                        Promoter notified
   │
   └── Reject submission → Submission marked as rejected
                           ↓
                           Feedback provided
                           ↓
                           Promoter notified and can revise
                           ↓
                           Process repeats from step 1

// Implementation in the application would involve:
// - State management for submission status
// - Notification system
// - Review interface for Project Admins
// - Feedback mechanism
// - Analytics integration`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

