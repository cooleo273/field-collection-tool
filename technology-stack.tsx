import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function TechnologyStack() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Frontend</CardTitle>
          <CardDescription>UI and client-side technologies</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Next.js</span>
                <p className="text-sm text-muted-foreground">
                  For server-side rendering, API routes, and file-based routing
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">React</span>
                <p className="text-sm text-muted-foreground">Component-based UI development</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Tailwind CSS</span>
                <p className="text-sm text-muted-foreground">Utility-first CSS for responsive design</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">React Hook Form</span>
                <p className="text-sm text-muted-foreground">Form validation and handling</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Zustand</span>
                <p className="text-sm text-muted-foreground">Lightweight state management</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backend</CardTitle>
          <CardDescription>Server-side technologies</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Next.js API Routes</span>
                <p className="text-sm text-muted-foreground">Serverless functions for API endpoints</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">TypeScript</span>
                <p className="text-sm text-muted-foreground">Type safety and better developer experience</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">NextAuth.js</span>
                <p className="text-sm text-muted-foreground">Authentication with role-based access control</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Zod</span>
                <p className="text-sm text-muted-foreground">Schema validation for API requests</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data & Infrastructure</CardTitle>
          <CardDescription>Storage and deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Mock Data Service</span>
                <p className="text-sm text-muted-foreground">Simulated database during development</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">IndexedDB</span>
                <p className="text-sm text-muted-foreground">Browser database for offline data storage</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Supabase (Future)</span>
                <p className="text-sm text-muted-foreground">PostgreSQL database with authentication</p>
              </div>
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 h-5 w-5 text-green-500 flex-shrink-0" />
              <div>
                <span className="font-medium">Vercel</span>
                <p className="text-sm text-muted-foreground">Deployment and hosting</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

