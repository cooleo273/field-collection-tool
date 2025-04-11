"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { createUserWithAuth } from "@/lib/supabase/users"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from "@/components/ui/alert"
import { Copy } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
})

type AddProjectAdminDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddProjectAdminDialog({ open, onOpenChange, onSuccess }: AddProjectAdminDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true)
      const result = await createUserWithAuth({
        ...values,
        role: "project-admin",
        status: "active",
      })
      setGeneratedPassword(result.password)
      toast({
        title: "Success",
        description: "Project admin created successfully",
      })
      form.reset()
    } catch (error) {
      console.error("Error creating project admin:", error)
      toast({
        title: "Error",
        description: "Failed to create project admin. Please try again.",
        variant: "destructive",
      })
      setGeneratedPassword(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    form.reset()
    setGeneratedPassword(null)
    onOpenChange(false)
    onSuccess()
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Project Admin</DialogTitle>
          <DialogDescription>Create a new project administrator account</DialogDescription>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-4">
            <Alert className="border-green-500">
              <AlertTitle>Project Admin created successfully!</AlertTitle>
              <AlertDescription className="mt-2">
                Please save this temporary password and share it with the project admin. This password is shown <strong>only once</strong> and cannot be retrieved later.
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
            
            <p className="text-sm text-muted-foreground">
              If you lose this password, you can send a password reset email to the project admin from the Edit Project Admin dialog.
            </p>
            
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

