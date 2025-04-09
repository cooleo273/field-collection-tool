import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MockDataStructure() {
  return (
    <Tabs defaultValue="users">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <Card>
          <CardHeader>
            <CardTitle>Users Schema</CardTitle>
            <CardDescription>User data structure with role-based permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {`interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project-admin' | 'promoter';
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedProjects?: string[]; // IDs of projects (for project-admin and promoter)
  assignedLocations?: string[]; // IDs of locations (for promoters)
  status: 'active' | 'inactive';
}`}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="campaigns">
        <Card>
          <CardHeader>
            <CardTitle>Campaigns Schema</CardTitle>
            <CardDescription>Campaign and community group data structure</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {`interface Campaign {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed';
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
  projectAdmins: string[]; // User IDs
}

interface CommunityGroup {
  id: string;
  name: string;
  type: string; // Type of community group
  location: string; // Location ID
  campaignId: string;
  createdAt: Date;
  updatedAt: Date;
}`}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="submissions">
        <Card>
          <CardHeader>
            <CardTitle>Submissions Schema</CardTitle>
            <CardDescription>Field data collection submission structure</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {`interface Submission {
  id: string;
  campaignId: string;
  locationId: string; // Area/Kebele
  communityGroupId: string;
  communityGroupType: string;
  participantCount: number;
  keyIssues: string;
  photoProof: string[]; // Array of file paths or base64
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedBy: string; // Promoter ID
  submittedAt: Date;
  reviewedBy?: string; // Project Admin ID
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'local' | 'synced'; // For offline functionality
}

interface Participant {
  id: string;
  submissionId: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}`}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="locations">
        <Card>
          <CardHeader>
            <CardTitle>Locations Schema</CardTitle>
            <CardDescription>Geographic locations data structure</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
              {`interface Location {
  id: string;
  name: string;
  type: 'kebele' | 'district' | 'zone' | 'region';
  parentId?: string; // For hierarchical structure
  campaignIds: string[]; // Campaigns active in this location
  createdAt: Date;
  updatedAt: Date;
}`}
            </pre>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

