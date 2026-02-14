"use client"

import type React from "react"
import { useState } from "react"

import { UndoableTextarea as Textarea } from "@/components/ui/undoable-input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Maximize2 } from "lucide-react"

interface CodeSegmentEditorProps {
  value: string
  onChange: (value: string) => void
}

export function CodeSegmentEditor({ value, onChange }: CodeSegmentEditorProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogValue, setDialogValue] = useState(value || "")

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const openDialog = () => {
    setDialogValue(value || "")
    setDialogOpen(true)
  }

  const handleDialogSave = () => {
    onChange(dialogValue)
    setDialogOpen(false)
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
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Rhai code executed when the transition fires. Input arc binding variables
          are in scope. Variables set here (e.g. <code className="text-xs">let result = ...</code>)
          can be used in output arc inscriptions.
        </p>
        <Button variant="ghost" size="sm" onClick={openDialog} title="Edit in expanded view">
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Code Segment</DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full h-[400px] font-mono text-sm p-3 rounded-md border bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder={"// Input arc variables are available\nlet result = n * 2 + 1;\n// Variables set here can be used by output arcs"}
            value={dialogValue}
            onChange={(e) => setDialogValue(e.target.value)}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Rhai code executed when the transition fires. Input arc binding variables
            are in scope. Variables set here (e.g. <code className="text-xs">let result = ...</code>)
            can be used in output arc inscriptions.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDialogSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


