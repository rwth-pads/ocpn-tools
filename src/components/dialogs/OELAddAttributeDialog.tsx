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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { v4 as uuidv4 } from "uuid"
import type { Attribute } from '@/components/ObjectEvolutionPanel';

interface AddAttributeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (attribute: Attribute) => void
}

export function AddAttributeDialog({ open, onOpenChange, onAdd }: AddAttributeDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"string" | "int" | "boolean" | "real">("string")
  const [initialValue, setInitialValue] = useState("")

  const handleAdd = () => {
    let parsedInitialValue: string | number | boolean

    switch (type) {
      case "int":
        parsedInitialValue = Number.parseInt(initialValue, 10) || 0
        break
      case "real":
        parsedInitialValue = Number.parseFloat(initialValue) || 0
        break
      case "boolean":
        parsedInitialValue = initialValue === "true"
        break
      default:
        parsedInitialValue = initialValue
    }

    const attribute: Attribute = {
      id: uuidv4(),
      name,
      type,
      initialValue: parsedInitialValue,
    }

    onAdd(attribute)

    // Reset form
    setName("")
    setType("string")
    setInitialValue("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Global Attribute</DialogTitle>
          <DialogDescription>Create a new attribute for the global context.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type} onValueChange={(value: "string" | "int" | "boolean" | "real") => setType(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String</SelectItem>
                <SelectItem value="int">Integer</SelectItem>
                <SelectItem value="real">Real</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="initialValue" className="text-right">
              Initial Value
            </Label>
            {type === "boolean" ? (
              <Select value={initialValue} onValueChange={setInitialValue}>
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
                id="initialValue"
                type={type === "int" || type === "real" ? "number" : "text"}
                value={initialValue}
                onChange={(e) => setInitialValue(e.target.value)}
                className="col-span-3"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name}>
            Add Attribute
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
