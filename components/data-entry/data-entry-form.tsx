"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, MoveVertical, Type, ListOrdered, Calendar, Image, CheckSquare } from "lucide-react"

interface DataEntryFormProps {
  campaignId: string
}

export function DataEntryForm({ campaignId }: DataEntryFormProps) {
  const [formFields, setFormFields] = useState([
    { id: "1", type: "text", label: "Specific Area/Kebele", required: true },
    { id: "2", type: "select", label: "Type of Community Group", required: true },
    { id: "3", type: "select", label: "Community Group", required: true },
    { id: "4", type: "number", label: "Count of Participants", required: true },
    { id: "5", type: "textarea", label: "Key Issues/Takeaways", required: true },
    { id: "6", type: "file", label: "Photo Proof", required: true },
  ])

  const addField = (type: string) => {
    const newField = {
      id: Date.now().toString(),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
    }
    setFormFields([...formFields, newField])
  }

  const removeField = (id: string) => {
    setFormFields(formFields.filter((field) => field.id !== id))
  }

  const updateField = (id: string, updates: Partial<(typeof formFields)[0]>) => {
    setFormFields(formFields.map((field) => (field.id === id ? { ...field, ...updates } : field)))
  }

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />
      case "number":
        return <ListOrdered className="h-4 w-4" />
      case "select":
        return <CheckSquare className="h-4 w-4" />
      case "textarea":
        return <Textarea className="h-4 w-4" />
      case "date":
        return <Calendar className="h-4 w-4" />
      case "file":
        return <Image className="h-4 w-4" />
      default:
        return <Type className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => addField("text")}>
          <Type className="mr-2 h-4 w-4" />
          Add Text Field
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("number")}>
          <ListOrdered className="mr-2 h-4 w-4" />
          Add Number Field
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("select")}>
          <CheckSquare className="mr-2 h-4 w-4" />
          Add Select Field
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("textarea")}>
          <Textarea className="mr-2 h-4 w-4" />
          Add Text Area
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("date")}>
          <Calendar className="mr-2 h-4 w-4" />
          Add Date Field
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField("file")}>
          <Image className="mr-2 h-4 w-4" />
          Add File Upload
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        {formFields.map((field) => (
          <Card key={field.id} className="relative">
            <div className="absolute right-2 top-2 flex gap-2">
              <Button variant="ghost" size="icon">
                <MoveVertical className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardContent className="pt-8">
              <div className="grid gap-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <Label htmlFor={`label-${field.id}`}>Field Label</Label>
                    <Input
                      id={`label-${field.id}`}
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`type-${field.id}`}>Field Type</Label>
                    <Select value={field.type} onValueChange={(value) => updateField(field.id, { type: value })}>
                      <SelectTrigger id={`type-${field.id}`}>
                        <SelectValue>
                          <div className="flex items-center">
                            {getFieldIcon(field.type)}
                            <span className="ml-2">{field.type}</span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="file">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(field.id, { required: checked })}
                  />
                  <Label htmlFor={`required-${field.id}`}>Required Field</Label>
                </div>

                {field.type === "select" && (
                  <div>
                    <Label>Options (comma separated)</Label>
                    <Input placeholder="Option 1, Option 2, Option 3" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {formFields.length === 0 && (
          <div className="text-center py-8 border rounded-md">
            <p className="text-muted-foreground mb-4">No form fields added yet</p>
            <Button variant="outline" onClick={() => addField("text")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Field
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

