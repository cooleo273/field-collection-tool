"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
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
import { createUserWithAuth } from "@/lib/services/users"
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from "@/components/ui/alert"
import { Copy } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
})

type FormValues = z.infer<typeof formSchema>

interface AddPromoterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  projectId: string    // Add projectId prop
  adminId: string      // Add adminId prop
}

export function AddPromoterDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  adminId,  // Add adminId to the props
}: AddPromoterDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
    mode: "onChange",
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      const result = await createUserWithAuth({
        name: values.name,
        email: values.email,
        role: "promoter",
        status: "active",
        projectId: projectId,
            // Pass adminId to createUserWithAuth
      })

      setGeneratedPassword(result.password)
      
      toast({
        title: "Success",
        description: "Promoter added successfully",
      })
      
    } catch (error) {
      console.error("Error adding promoter:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add promoter",
        variant: "destructive",
      })
      setGeneratedPassword(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleClose() {
    // Reset form and state when closing
    form.reset()
    setGeneratedPassword(null)
    onOpenChange(false)
    onSuccess?.()
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
          <DialogTitle>Add New Promoter</DialogTitle>
          <DialogDescription>
            Add a new field data collector with login access
          </DialogDescription>
        </DialogHeader>

        {generatedPassword ? (
          <div className="space-y-4">
            <Alert className="border-green-500">
              <AlertTitle>Promoter created successfully!</AlertTitle>
              <AlertDescription className="mt-2">
                Please save this temporary password and share it with the promoter. This password is shown <strong>only once</strong> and cannot be retrieved later.
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
              If you lose this password, you can send a password reset email to the promoter from the Edit Promoter dialog.
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
                      <Input placeholder="Enter promoter's full name" {...field} />
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
                  {isSubmitting ? "Adding..." : "Add Promoter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

