"use client"

import type React from "react"

import { UndoableTextarea as Textarea } from "@/components/ui/undoable-input"
import { Label } from "@/components/ui/label"

interface CodeSegmentEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeSegmentEditor({ value, onChange }: CodeSegmentEditorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="code-segment">Code Segment</Label>
      <Textarea
        id="code-segment"
        placeholder={"// Input arc variables are available\nlet result = n * 2 + 1;\n// Variables set here can be used by output arcs"}
        className="font-mono h-[120px] text-sm"
        value={value || ""}
        onChange={handleChange}
      />
      <p className="text-xs text-muted-foreground">
        Rhai code executed when the transition fires. Input arc binding variables
        are in scope. Variables set here (e.g. <code className="text-xs">let result = ...</code>)
        can be used in output arc inscriptions.
      </p>
    </div>
  )
}


