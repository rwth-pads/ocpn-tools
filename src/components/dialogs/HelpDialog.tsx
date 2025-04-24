import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";

interface HelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [markdownContent, setMarkdownContent] = useState<string>("")

  useEffect(() => {
    // Fetch the markdown file when the dialog opens
    if (open) {
      fetch("usage-guide.md")
        .then((response) => response.text())
        .then((text) => setMarkdownContent(text))
        .catch((error) => {
          console.error("Error loading help content:", error)
          setMarkdownContent("# Error\nFailed to load help content. Please try again later.")
        })
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Help & Documentation</DialogTitle>
          <DialogDescription>Learn how to use OCPN Tools with this guide.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 h-[60vh]">
          <div className="markdown-content">
            <ReactMarkdown>{markdownContent}</ReactMarkdown>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
