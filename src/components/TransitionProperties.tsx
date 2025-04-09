import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SelectedElement } from '@/types';
import { CodeSegmentEditor } from "@/components/CodeSegmentEditor";

import type { Priority } from "@/declarations";

const TransitionProperties = ({ priorities }: { priorities: Priority[] }) => {
  const selectedElement = useStore((state) => state.selectedElement) as SelectedElement | null;
  const updateNodeData = useStore((state) => state.updateNodeData);

  // Ensure selectedElement is a node and has the correct data type
  if (!selectedElement || selectedElement.type !== 'node' || !selectedElement.element) {
    return <div>No node selected</div>;
  }

  const { id, data }: { id: string; data: { label?: string; colorSet?: string; isArcMode?: boolean; type?: string; initialMarking?: string; guard?: string; time?: string; priority?: string; codeSegment?: string } } = selectedElement.element;

  // Type guard to ensure data is of type TransitionNodeData
  if (!('guard' in data)) {
    return <div>Invalid node type</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label ?? ""}
          onChange={(e) => updateNodeData(id, { ...data, label: e.target.value, isArcMode: data.isArcMode || false, type: data.type || 'defaultType', colorSet: data.colorSet || 'defaultColorSet', initialMarking: data.initialMarking || 'defaultMarking' })}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="guard">Guard</Label>
        <Input
          id="guard"
          value={data.guard || ""}
          onChange={(e) => updateNodeData(id, {
            ...data,
            label: data.label || "",
            guard: e.target.value,
            isArcMode: data.isArcMode || false,
            type: data.type || "defaultType",
            colorSet: data.colorSet || "defaultColorSet",
            initialMarking: data.initialMarking || "defaultMarking",
          })}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="time">Time</Label>
        <Input
          id="time"
          value={data.time || ""}
          onChange={(e) => updateNodeData(id, {
            ...data,
            label: data.label || "",
            time: e.target.value,
            isArcMode: data.isArcMode || false,
            type: data.type || "defaultType",
            colorSet: data.colorSet,
            initialMarking: data.initialMarking,
            priority: data.priority || "NONE",
            codeSegment: data.codeSegment || "",
            guard: data.guard || "",
          })}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="priority">Priority</Label>
        <Select
          value={data.priority || "NONE"}
          onValueChange={(value) => updateNodeData(id, {
            ...data,
            label: data.label || "",
            priority: value,
            isArcMode: data.isArcMode || false,
            type: data.type || "defaultType",
            colorSet: data.colorSet,
            initialMarking: data.initialMarking,
            guard: data.guard || "",
            time: data.time || "",
            codeSegment: data.codeSegment || "",
          })}
        >
          <SelectTrigger id="priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">None</SelectItem>
            {priorities.map((p) => (
              <SelectItem key={p.id} value={p.name}>
                {p.name} ({p.level})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="codeSegment">Code Segment</Label>
        <CodeSegmentEditor
          value={data.codeSegment || ""}
          onChange={(value) => updateNodeData(id, {
            ...data,
            label: data.label || "",
            codeSegment: value,
            isArcMode: data.isArcMode || false,
            type: data.type || "defaultType",
            colorSet: data.colorSet,
            initialMarking: data.initialMarking,
            guard: data.guard || "",
            time: data.time || "",
            priority: data.priority || "NONE",
          })}
        />
      </div>
    </div>
  )
}

export default TransitionProperties;
