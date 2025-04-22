import type React from "react";

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, FileUp } from "lucide-react"

interface OpenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFileLoaded: (fileContent: string, fileName: string) => void
}

export function OpenDialog({ open, onOpenChange, onFileLoaded }: OpenDialogProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      readFile(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      readFile(file)
    }
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        onFileLoaded(e.target.result as string, file.name)
        onOpenChange(false)
      }
    }
    reader.readAsText(file)
  }

  const handleOpenFileClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Open Petri Net</DialogTitle>
          <DialogDescription>
            Load a CPN Tools .cpn or cpn-py JSON file to visualize your Petri Net.
          </DialogDescription>
        </DialogHeader>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Drag & Drop</h3>
            <p className="text-sm text-muted-foreground mb-4">Drop your Petri Net file here, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.json,.cpn,.ocpn"
              className="hidden"
              onChange={handleFileInputChange}
            />
            <Button onClick={handleOpenFileClick} variant="outline">
              <FileUp className="mr-2 h-4 w-4" />
              Open File...
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

