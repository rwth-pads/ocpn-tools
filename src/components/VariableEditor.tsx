import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ColorSet, Variable } from "@/declarations";

interface VariableEditorProps {
  variable?: Variable
  existingColorSets: ColorSet[]
  onSave: (variable: Omit<Variable, "id">) => void
}

export function VariableEditor({ variable, existingColorSets, onSave }: VariableEditorProps) {
  const [name, setName] = useState(variable?.name || "");
  const [colorSet, setColorSet] = useState(variable?.colorSet || "INT");

  const handleSave = () => {
    onSave({
      name,
      colorSet
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="e.g., n" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2 flex-none mt-auto pb-2">
          :
        </div>
        <div className="space-y-2 flex-1">
          <Label htmlFor="baseColorSet">Type</Label>
          <Select value={colorSet || "INT"} onValueChange={setColorSet}>
            <SelectTrigger>
              <SelectValue placeholder="Select color set" />
            </SelectTrigger>
            <SelectContent>
              {existingColorSets.map((cs) => (
                <SelectItem key={cs.id} value={cs.name}>
                  {cs.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={handleSave} className="w-full">
          Save Variable
        </Button>
      </div>
    </div>
  )
}

