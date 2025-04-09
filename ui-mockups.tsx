import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"

export default function UIMockups() {
  return (
    <Tabs defaultValue="admin">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="admin">Admin UI</TabsTrigger>
        <TabsTrigger value="project-admin">Project Admin UI</TabsTrigger>
        <TabsTrigger value="promoter">Promoter UI</TabsTrigger>
      </TabsList>

      <TabsContent value="admin">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>System-wide management interface</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src="/placeholder.svg?height=600&width=800"
              alt="Admin Dashboard Mockup"
              width={800}
              height={600}
              className="border rounded-md shadow-sm"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="project-admin">
        <Card>
          <CardHeader>
            <CardTitle>Project Admin Dashboard</CardTitle>
            <CardDescription>Campaign management and submission review</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src="/placeholder.svg?height=600&width=800"
              alt="Project Admin Dashboard Mockup"
              width={800}
              height={600}
              className="border rounded-md shadow-sm"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="promoter">
        <Card>
          <CardHeader>
            <CardTitle>Promoter Dashboard</CardTitle>
            <CardDescription>Data collection and submission interface</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Image
              src="/placeholder.svg?height=600&width=800"
              alt="Promoter Dashboard Mockup"
              width={800}
              height={600}
              className="border rounded-md shadow-sm"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

