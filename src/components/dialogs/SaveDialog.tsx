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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SaveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (format: string) => void
  petriNetName: string
}

export function SaveDialog({ open, onOpenChange, onSave, petriNetName }: SaveDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("cpn-tools")

  const handleSave = () => {
    onSave(selectedFormat)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Petri Net</DialogTitle>
          <DialogDescription>Choose a format to save your Petri Net "{petriNetName}".</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat} className="space-y-3">
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="cpn-tools" id="cpn-tools" />
              <div className="grid gap-1.5">
                <Label htmlFor="cpn-tools" className="font-medium">
                  CPN Tools XML
                </Label>
                <p className="text-sm text-muted-foreground">
                  Standard format for CPN Tools. Best for compatibility with CPN Tools.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="cpn-py" id="cpn-py"/>
              <div className="grid gap-1.5">
                <Label htmlFor="cpn-py" className="font-medium">
                  cpn-py JSON
                </Label>
                <p className="text-sm text-muted-foreground">
                  Format compatible with cpn-py library. Best for Python integration.
                </p>
              </div>
            </div>
            {/* <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="json" id="json" disabled/>
              <div className="grid gap-1.5">
                <Label htmlFor="json" className="font-medium">
                  JSON
                </Label>
                <p className="text-sm text-muted-foreground">
                  Simple JSON format. Best for web applications and custom processing.
                </p>
              </div>
            </div> */}
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

