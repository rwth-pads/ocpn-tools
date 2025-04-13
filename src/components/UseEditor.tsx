import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { Use } from "@/declarations";

interface UseEditorProps {
  existingUse?: Use
  onSave: (use: Omit<Use, "id">) => void
}

export function UseEditor({ existingUse, onSave }: UseEditorProps) {
  const [use, setUse] = useState<Omit<Use, "id">>({
    name: existingUse?.name || "",
    content: existingUse?.content || "",
  })
  const [isTextareaDragging, setIsTextareaDragging] = useState(false)

  const handleSave = () => {
    if (use.name.trim()) {
      onSave(use)
    }
  }

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setUse((prev) => ({ ...prev, content }))
    }
    reader.readAsText(file)

    // If the file name is not set, use the file name (with extension)
    if (!use.name.trim() && file.name) {
      const fileName = file.name; //.split(".")[0]
      setUse((prev) => ({ ...prev, name: fileName }))
    }
  }

  const handleTextareaDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsTextareaDragging(true)
  }

  const handleTextareaDragLeave = () => {
    setIsTextareaDragging(false)
  }

  const handleTextareaDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsTextareaDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      readFile(file)
    }
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="use-name">Name</Label>
        <Input
          id="use-name"
          placeholder="e.g., Utils.sml"
          value={use.name}
          onChange={(e) => setUse({ ...use, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="use-content">Content</Label>
          {/* <Button variant="ghost" size="sm" onClick={triggerFileUpload} className="h-8 px-2">
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button> */}
        </div>
        <div className="relative">
          <Textarea
            id="use-content"
            placeholder="Enter the content of the external file or drag and drop a file here..."
            className={`font-mono h-[300px] max-w-[550px] transition-colors ${isTextareaDragging ? "border-primary bg-primary/5" : ""
              }`}
            value={use.content}
            onChange={(e) => setUse({ ...use, content: e.target.value })}
            onDragOver={handleTextareaDragOver}
            onDragLeave={handleTextareaDragLeave}
            onDrop={handleTextareaDrop}
          />
          {isTextareaDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-md pointer-events-none">
              <div className="bg-background p-3 rounded-md shadow-md">
                <p className="text-sm font-medium">Drop file to import content</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          This content will be included as an external file reference in the CPN model. You can edit it manually or
          <strong> drag and drop a file</strong> directly onto the text area to import its content.
        </p>
      </div>

      <div className="pt-4">
        <Button className="w-full" type="submit" onClick={handleSave}>
          Save Library
        </Button>
      </div>
    </div>
  )
}
