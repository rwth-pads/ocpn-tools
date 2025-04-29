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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface OCELExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (format: "json" | "xml" | "sqlite") => void
}

export function OCELExportDialog({ open, onOpenChange, onExport }: OCELExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<"json" | "xml" | "sqlite">("json")

  const handleExport = () => {
    onExport(selectedFormat)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export as OCEL 2.0</DialogTitle>
          <DialogDescription>
            Choose a format to export your simulation data as an Object-Centric Event Log (OCEL 2.0).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={selectedFormat}
            onValueChange={(value: "json" | "xml" | "sqlite") => setSelectedFormat(value)}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="json" id="json" />
              <div className="grid gap-1.5">
                <Label htmlFor="json" className="font-medium">
                  JSON
                </Label>
                <p className="text-sm text-muted-foreground">
                  Standard JSON format for OCEL 2.0. Best for web applications and analysis tools.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="xml" id="xml" />
              <div className="grid gap-1.5">
                <Label htmlFor="xml" className="font-medium">
                  XML
                </Label>
                <p className="text-sm text-muted-foreground">
                  XML format for OCEL 2.0. Good for compatibility with legacy systems.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="sqlite" id="sqlite" />
              <div className="grid gap-1.5">
                <Label htmlFor="sqlite" className="font-medium">
                  SQLite
                </Label>
                <p className="text-sm text-muted-foreground">
                  SQLite database format. Best for large event logs and direct database queries.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Export</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
