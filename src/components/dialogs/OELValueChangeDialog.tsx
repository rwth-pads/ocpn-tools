import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import type { Attribute, ValueChange } from '@/components/ObjectEvolutionPanel';

interface ValueChangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attribute: Attribute
  timestamp: number
  existingChange?: ValueChange | null
  onSave: (change: ValueChange) => void
  onDelete?: () => void
}

export function ValueChangeDialog({
  open,
  onOpenChange,
  attribute,
  timestamp,
  existingChange,
  onSave,
  onDelete,
}: ValueChangeDialogProps) {
  const [operation, setOperation] = useState<string>("set")
  const [value, setValue] = useState<string>("")
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(timestamp)

  // Reset form when dialog opens
  /* eslint-disable react-hooks/set-state-in-effect -- Dialog form reset on open */
  useEffect(() => {
    if (open) {
      if (existingChange) {
        setOperation(existingChange.operation)
        setValue(existingChange.value.toString())
        setCurrentTimestamp(existingChange.timestamp)
      } else {
        setOperation(attribute.type === "string" ? "set" : "add")
        setValue("")
        setCurrentTimestamp(timestamp)
      }
    }
  }, [open, attribute, timestamp, existingChange])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Get available operations based on attribute type
  const getAvailableOperations = () => {
    if (attribute.type === "string") {
      return [
        { value: "set", label: "Set to" },
        { value: "prefix", label: "Prefix" },
        { value: "append", label: "Append" },
        { value: "reset", label: "Reset to initial value" },
      ]
    } else if (attribute.type === "int" || attribute.type === "real") {
      return [
        { value: "set", label: "Set to" },
        { value: "add", label: "Add" },
        { value: "subtract", label: "Subtract" },
        { value: "increasePercent", label: "Increase by %" },
        { value: "decreasePercent", label: "Decrease by %" },
        { value: "reset", label: "Reset to initial value" },
      ]
    } else if (attribute.type === "boolean") {
      return [
        { value: "set", label: "Set to" },
        { value: "toggle", label: "Toggle" },
        { value: "reset", label: "Reset to initial value" },
      ]
    }
    return []
  }

  // Handle save
  const handleSave = () => {
    const parsedValue =
      attribute.type === "int"
        ? Number.parseInt(value, 10)
        : attribute.type === "real"
          ? Number.parseFloat(value)
          : attribute.type === "boolean"
            ? value === "true"
            : value

    const change: ValueChange = {
      id: existingChange?.id || uuidv4(),
      attributeId: attribute.id,
      timestamp: currentTimestamp,
      operation,
      value: parsedValue,
    }

    onSave(change)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{existingChange ? "Edit Value Change" : "Add Value Change"}</DialogTitle>
          <DialogDescription>Define how the attribute "{attribute.name}" changes at a specific time.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timestamp" className="text-right">
              Timestamp
            </Label>
            <Input
              id="timestamp"
              type="number"
              value={currentTimestamp}
              onChange={(e) => setCurrentTimestamp(Number(e.target.value))}
              className="col-span-3"
              min={0}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="operation" className="text-right">
              Operation
            </Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select operation" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableOperations().map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {operation !== "reset" && operation !== "toggle" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="value" className="text-right">
                Value
              </Label>
              {attribute.type === "boolean" ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="value"
                  type={attribute.type === "int" || attribute.type === "real" ? "number" : "text"}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="col-span-3"
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingChange && onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
