"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { uploadImage } from "@/lib/services/storage.service"
import { useToast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  value?: string
  onUpload: (url: string) => void
  onRemove: () => void
  className?: string
}

export function ImageUpload({
  onUpload,
  onRemove,
  value,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const { toast } = useToast()

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setIsUploading(true);
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size exceeds 5MB limit.",
          variant: "destructive",
        });
        return;
      }

      const url = await uploadImage(file, "submissions");
      console.log("Uploaded image URL:", url);
      setPreview(url);
      onUpload(url);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
  })

  const handleRemove = () => {
    setPreview(null)
    onRemove()
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => {
              setPreview(null);
              toast({
                title: "Error",
                description: "Failed to load image.",
                variant: "destructive",
              });
            }}
          />
          {!isUploading && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full mobile-button-icon"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors",
            isDragActive
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/25 hover:border-primary/50",
            className || ""
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag and drop an image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, GIF up to 5MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

