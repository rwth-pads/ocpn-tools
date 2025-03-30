"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, GripVertical, Edit } from "lucide-react"
import { AdvancedColorSetEditor } from "@/components/AdvancedColorSetEditor"

export interface ColorSet {
  id: string
  name: string
  type: string
  definition: string
  color?: string // Add color property
}

export interface Variable {
  id: string
  name: string
  colorSet: string
}

export interface Priority {
  id: string
  name: string
  level: number
}

interface DeclarationManagerProps {
  colorSets: ColorSet[]
  variables: Variable[]
  priorities: Priority[]
  onAddColorSet: (colorSet: Omit<ColorSet, "id">) => void
  onAddVariable: (variable: Omit<Variable, "id">) => void
  onAddPriority: (priority: Omit<Priority, "id">) => void
  onDeleteColorSet: (id: string) => void
  onDeleteVariable: (id: string) => void
  onDeletePriority: (id: string) => void
  onReorderColorSets: (newOrder: ColorSet[]) => void
  onReorderVariables: (newOrder: Variable[]) => void
  onReorderPriorities: (newOrder: Priority[]) => void
}

export function DeclarationManager({
  colorSets,
  variables,
  priorities,
  onAddColorSet,
  onAddVariable,
  onAddPriority,
  onDeleteColorSet,
  onDeleteVariable,
  onDeletePriority,
  onReorderColorSets,
  onReorderVariables,
  onReorderPriorities,
}: DeclarationManagerProps) {
  const [newColorSet, setNewColorSet] = useState({ name: "", type: "basic" })
  const [newVariable, setNewVariable] = useState({ name: "", colorSet: "INT" })
  const [newPriority, setNewPriority] = useState({ name: "", level: 100 })
  const [selectedColorSet, setSelectedColorSet] = useState<ColorSet | undefined>(undefined)
  const [advancedEditorOpen, setAdvancedEditorOpen] = useState(false)

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [draggedType, setDraggedType] = useState<"colorSet" | "variable" | "priority" | null>(null)

  const handleAddColorSet = () => {
    if (newColorSet.name) {
      onAddColorSet({
        name: newColorSet.name,
        type: newColorSet.type,
        definition: `colset ${newColorSet.name} = ${newColorSet.type === "basic" ? "int" : "product"};`,
      })
      setNewColorSet({ name: "", type: "basic" })
    }
  }

  const handleAddVariable = () => {
    if (newVariable.name && newVariable.colorSet) {
      onAddVariable({
        name: newVariable.name,
        colorSet: newVariable.colorSet,
      })
      setNewVariable({ name: "", colorSet: "INT" })
    }
  }

  const handleAddPriority = () => {
    if (newPriority.name && newPriority.level) {
      onAddPriority({
        name: newPriority.name,
        level: Number(newPriority.level),
      })
      setNewPriority({ name: "", level: 100 })
    }
  }

  const handleEditColorSet = (colorSet: ColorSet) => {
    setSelectedColorSet(colorSet)
    setAdvancedEditorOpen(true)
  }

  const handleSaveAdvancedColorSet = (colorSet: Omit<ColorSet, "id">) => {
    if (selectedColorSet) {
      // Update existing color set
      const updatedColorSets = colorSets.map((cs) => (cs.id === selectedColorSet.id ? { ...cs, ...colorSet } : cs))
      onReorderColorSets(updatedColorSets)
    } else {
      // Add new color set
      onAddColorSet(colorSet)
    }
    setAdvancedEditorOpen(false)
    setSelectedColorSet(undefined)
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, item: any, type: "colorSet" | "variable" | "priority") => {
    setDraggedItem(item)
    setDraggedType(type)
    e.dataTransfer.effectAllowed = "move"
    // Required for Firefox
    e.dataTransfer.setData("text/plain", item.id)
  }

  const handleDragOver = (e: React.DragEvent, targetItem: any) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    if (draggedItem && draggedItem.id !== targetItem.id) {
      // Add visual feedback for the drop target
      const target = e.currentTarget as HTMLElement
      target.classList.add("bg-muted")
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove("bg-muted")
  }

  const handleDrop = (e: React.DragEvent, targetItem: any) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.classList.remove("bg-muted")

    if (!draggedItem || !draggedType) return

    if (draggedItem.id === targetItem.id) return

    // Reorder the items
    if (draggedType === "colorSet") {
      const newOrder = [...colorSets]
      const draggedIndex = newOrder.findIndex((item) => item.id === draggedItem.id)
      const targetIndex = newOrder.findIndex((item) => item.id === targetItem.id)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedItem)
        onReorderColorSets(newOrder)
      }
    } else if (draggedType === "variable") {
      const newOrder = [...variables]
      const draggedIndex = newOrder.findIndex((item) => item.id === draggedItem.id)
      const targetIndex = newOrder.findIndex((item) => item.id === targetItem.id)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedItem)
        onReorderVariables(newOrder)
      }
    } else if (draggedType === "priority") {
      const newOrder = [...priorities]
      const draggedIndex = newOrder.findIndex((item) => item.id === draggedItem.id)
      const targetIndex = newOrder.findIndex((item) => item.id === targetItem.id)

      if (draggedIndex !== -1 && targetIndex !== -1) {
        newOrder.splice(draggedIndex, 1)
        newOrder.splice(targetIndex, 0, draggedItem)
        onReorderPriorities(newOrder)
      }
    }

    setDraggedItem(null)
    setDraggedType(null)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
    setDraggedType(null)
  }

  return (
    <div className="space-y-4">
      {/* Color Sets Section */}
      <div className="space-y-3">
        <Label>Color Sets</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Name (e.g., DATA)"
            className="flex-1"
            value={newColorSet.name}
            onChange={(e) => setNewColorSet({ ...newColorSet, name: e.target.value })}
          />
          <Select value={newColorSet.type} onValueChange={(value) => setNewColorSet({ ...newColorSet, type: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="compound">Compound</SelectItem>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="record">Record</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" variant="outline" onClick={handleAddColorSet}>
          Add Color Set
        </Button>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {colorSets.map((cs) => (
            <div
              key={cs.id}
              className="border rounded-md p-3 bg-muted/20 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, cs, "colorSet")}
              onDragOver={(e) => handleDragOver(e, cs)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, cs)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="font-mono text-sm">
                    colset {cs.name} = {cs.type};
                  </div>
                </div>
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: cs.color || "#3b82f6" }}
                  ></div>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditColorSet(cs)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDeleteColorSet(cs.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog open={advancedEditorOpen} onOpenChange={setAdvancedEditorOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setSelectedColorSet(undefined)
                setAdvancedEditorOpen(true)
              }}
            >
              Advanced Color Set Editor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedColorSet ? `Edit Color Set: ${selectedColorSet.name}` : "Create New Color Set"}
              </DialogTitle>
            </DialogHeader>
            <AdvancedColorSetEditor
              colorSet={selectedColorSet}
              existingColorSets={colorSets}
              onSave={handleSaveAdvancedColorSet}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Variables Section */}
      <div className="space-y-3">
        <Label>Variables</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Name (e.g., n)"
            className="flex-1"
            value={newVariable.name}
            onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
          />
          <Select
            value={newVariable.colorSet}
            onValueChange={(value) => setNewVariable({ ...newVariable, colorSet: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Color Set" />
            </SelectTrigger>
            <SelectContent>
              {colorSets.map((cs) => (
                <SelectItem key={cs.id} value={cs.name}>
                  {cs.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" variant="outline" onClick={handleAddVariable}>
          Add Variable
        </Button>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {variables.map((v) => (
            <div
              key={v.id}
              className="border rounded-md p-3 bg-muted/20 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, v, "variable")}
              onDragOver={(e) => handleDragOver(e, v)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, v)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="font-mono text-sm">
                    var {v.name}: {v.colorSet};
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDeleteVariable(v.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Priorities Section */}
      <div className="space-y-3">
        <Label>Priorities</Label>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Name (e.g., HIGH)"
            className="flex-1"
            value={newPriority.name}
            onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
          />
          <Input
            type="number"
            placeholder="Level (e.g., 100)"
            className="w-[120px]"
            value={newPriority.level || ""}
            onChange={(e) => setNewPriority({ ...newPriority, level: Number.parseInt(e.target.value) || 0 })}
          />
        </div>

        <Button size="sm" variant="outline" onClick={handleAddPriority}>
          Add Priority
        </Button>

        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {priorities.map((p) => (
            <div
              key={p.id}
              className="border rounded-md p-3 bg-muted/20 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, p, "priority")}
              onDragOver={(e) => handleDragOver(e, p)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, p)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="font-mono text-sm">
                    {p.name} = {p.level}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDeletePriority(p.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

