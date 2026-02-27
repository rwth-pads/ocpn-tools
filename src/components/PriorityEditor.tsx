import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Priority } from "@/declarations";

interface PriorityEditorProps {
  priority?: Priority
  onSave: (variable: Omit<Priority, "id">) => void
}

export function PriorityEditor({ priority, onSave }: PriorityEditorProps) {
  const [name, setName] = useState(priority?.name || "");
  const [level, setLevel] = useState(priority?.level || 100);

  const handleSave = () => {
    onSave({
      name,
      level
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="space-y-2 flex-1">
          <Label htmlFor="name">Name</Label>
          <Input
            placeholder="Name (e.g., P_MEDIUM)"
            className="flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2 flex-none">
          <Label htmlFor="baseColorSet">Level</Label>
          <Input
            type="number"
            placeholder="Level (e.g., 250)"
            className="w-[120px]"
            value={level || ""}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={handleSave} className="w-full">
          Save Priority
        </Button>
      </div>
    </div>
  )
}

