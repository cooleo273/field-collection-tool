import Image from "next/image"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="absolute inset-0 -z-10 h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
      
      <div className="flex-1 flex flex-col space-y-8 md:flex-row md:space-y-0">
        {/* Left side with hero content */}
        <div className="flex-1 p-4 md:p-8 flex flex-col justify-center items-center md:items-start md:pl-8 lg:pl-16">
          <div className="max-w-xl space-y-4 md:space-y-6">
            <div className="inline-block">
              <div className="flex items-center space-x-2">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 22V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 7L12 12L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 12L12 17L20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="text-lg md:text-xl font-bold">Akofada BCC</h2>
              </div>
            </div>
            
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Field Data Collection Platform
            </h1>
            
            <p className="text-muted-foreground text-base md:text-lg">
              A comprehensive solution for collecting, managing, and analyzing field data for behavioral change communication campaigns.
            </p>
            
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-sm md:text-base">Field data collection</div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="text-sm md:text-base">Real-time analytics</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side with login form */}
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}

