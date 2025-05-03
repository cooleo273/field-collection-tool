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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createLocation } from "@/lib/services/locations"
import type { Location } from "@/lib/services/locations"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["town", "kebele", "district", "zone", "region"]),
})

type FormValues = z.infer<typeof formSchema>

interface AddLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  parentLocation?: Location | null
}

export function AddLocationDialog({
  open,
  onOpenChange,
  onSuccess,
  parentLocation,
}: AddLocationDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "town",
    },
    mode: "onChange",
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      await createLocation(values)
      toast({
        title: "Success",
        description: "Location created successfully",
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error("Error creating location:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create location",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Location</DialogTitle>
          <DialogDescription>
            Create a new location in the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="town">Town</SelectItem>
                      <SelectItem value="kebele">Kebele</SelectItem>
                      <SelectItem value="district">District</SelectItem>
                      <SelectItem value="zone">Zone</SelectItem>
                      <SelectItem value="region">Region</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Location"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

