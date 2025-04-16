"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createUserWithAuth } from "@/lib/services/users.service"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Copy } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"
import { supabase } from "@/lib/services/client"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  projectIds: z.array(z.string()).optional(),
})

// Define the type for form values
type FormValues = z.infer<typeof formSchema>;

interface AddProjectAdminDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (result: { password: string; user: any }) => void
}

export function AddProjectAdminDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddProjectAdminDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Add form initialization
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      projectIds: [],
    },
    mode: "onChange",
  })

  // Add useEffect to fetch projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setProjects(data || [])
      } catch (error) {
        console.error('Error fetching projects:', error)
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchProjects()
    }
  }, [open])

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      const result = await createUserWithAuth({
        name: values.name,
        email: values.email,
        role: "project-admin",
        status: "active"
      })

      setGeneratedPassword(result.password)
      
      if (onSuccess) {
        onSuccess(result)  // Pass the entire result object
      }
    } catch (error) {
      // ... error handling ...
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    form.reset()
    setGeneratedPassword(null)
    onOpenChange(false)
    // Fix: Only call onSuccess if it exists and provide the required argument
    if (onSuccess && generatedPassword) {
      onSuccess({
        password: generatedPassword,
        user: null // Since we don't have the user object here, pass null
      });
    }
  }

  function copyToClipboard() {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword)
      toast({
        title: "Copied",
        description: "Password copied to clipboard",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Project Admin</DialogTitle>
          <DialogDescription>
            Create a new project administrator account
          </DialogDescription>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-4">
            <Alert className="border-green-500">
              <AlertTitle>Project Admin created successfully!</AlertTitle>
              <AlertDescription className="mt-2">
                Please save this temporary password and share it with the admin. This password is shown <strong>only once</strong> and cannot be retrieved later.
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center gap-2 bg-muted p-3 rounded-md">
              <code className="text-sm font-mono flex-1 break-all">{generatedPassword}</code>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={copyToClipboard}
                className="h-8 w-8 p-0" 
                type="button"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project admin's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter email address" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projectIds"
                render={() => (
                  <FormItem className="space-y-3">
                    <div className="flex justify-between items-center">
                      <FormLabel>Assign Projects</FormLabel>
                      {projects.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {form.watch("projectIds")?.length || 0} of {projects.length} selected
                        </span>
                      )}
                    </div>
                    <FormControl>
                      <div className="border rounded-md overflow-hidden">
                        {loading ? (
                          <div className="flex items-center justify-center h-[200px] bg-muted/20">
                            <div className="flex flex-col items-center gap-2">
                              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-sm text-muted-foreground">Loading projects...</span>
                            </div>
                          </div>
                        ) : projects.length === 0 ? (
                          <div className="flex items-center justify-center h-[200px] bg-muted/20">
                            <div className="text-center p-4">
                              <p className="text-sm font-medium text-muted-foreground mb-2">No projects available</p>
                              <p className="text-xs text-muted-foreground">Create projects first before assigning them to admins</p>
                            </div>
                          </div>
                        ) : (
                          <ScrollArea className="h-[200px]">
                            <div className="p-2">
                              {projects.map((project) => (
                                <FormField
                                  key={project.id}
                                  control={form.control}
                                  name="projectIds"
                                  render={({ field }) => {
                                    return (
                                      <div className="mb-1 last:mb-0">
                                        <label
                                          htmlFor={`project-${project.id}`}
                                          className="flex items-center space-x-3 rounded-md px-3 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                          <Checkbox
                                            id={`project-${project.id}`}
                                            checked={field.value?.includes(project.id)}
                                            onCheckedChange={(checked) => {
                                              const currentValues = field.value || [];
                                              field.onChange(
                                                checked 
                                                  ? [...currentValues, project.id]
                                                  : currentValues.filter(id => id !== project.id)
                                              );
                                            }}
                                            className="h-2 w-5 rounded-sm border-primary/50 data-[state=checked]:bg-primary/90"
                                          />
                                          <div className="flex-1 space-y-1">
                                            <p className="text-sm font-medium leading-none">{project.name}</p>
                                          </div>
                                          <span 
                                            className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                                              project.status === 'active' 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-gray-100 text-gray-600'
                                            }`}
                                          >
                                            {project.status}
                                          </span>
                                        </label>
                                      </div>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project Admin"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

