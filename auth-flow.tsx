import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthFlow() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Flow</CardTitle>
          <CardDescription>Role-based authentication process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto">
              {`// auth.ts - Authentication logic
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail } from "@/lib/mock-data/users";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // In production, this would validate against a real database
        const user = getUserByEmail(credentials.email);
        
        if (!user || user.status !== 'active') {
          return null;
        }
        
        // Mock password check (in production, use proper password hashing)
        const isValidPassword = credentials.password === 'password'; // Mock check
        
        if (!isValidPassword) {
          return null;
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          assignedProjects: user.assignedProjects,
          assignedLocations: user.assignedLocations,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.assignedProjects = user.assignedProjects;
        token.assignedLocations = user.assignedLocations;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.assignedProjects = token.assignedProjects as string[];
        session.user.assignedLocations = token.assignedLocations as string[];
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
  },
};`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Authorization</CardTitle>
          <CardDescription>Protecting routes based on user roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <pre className="text-sm overflow-auto">
              {`// middleware.ts - Role-based route protection
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

// Role-based route mapping
const roleRoutes = {
  admin: ['/admin', '/dashboard'],
  'project-admin': ['/projects', '/dashboard'],
  promoter: ['/submissions', '/dashboard'],
};

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/error'];

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const path = request.nextUrl.pathname;
  
  // Allow public routes
  if (publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  const role = token.role as string;
  
  // Check if user has access to the requested route
  const hasAccess = Object.entries(roleRoutes).some(([routeRole, routes]) => {
    if (routeRole === role) {
      return routes.some(route => path.startsWith(route));
    }
    
    // Admin has access to all routes
    if (role === 'admin') {
      return true;
    }
    
    return false;
  });
  
  // Redirect to dashboard if user doesn't have access
  if (!hasAccess) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

