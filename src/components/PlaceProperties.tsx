import React from 'react';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PlaceProperties = ({ selectedElement, updateNodeData, colorSets }) => {
  const { id, data, style } = selectedElement?.data || {}
  const nodeWidth = style?.width || 80
  const nodeHeight = style?.height || 80

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data?.label || ""}
          onChange={(e) => updateNodeData(id, { ...data, label: e.target.value })}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="colorSet">Color Set</Label>
        <Select
          value={data?.colorSet || "INT"}
          onValueChange={(value) => {
            const colorSetObj = colorSets.find((cs) => cs.name === value)
            updateNodeData(id, {
              ...data,
              colorSet: value,
              colorSetColor: colorSetObj?.color,
            })
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select color set" />
          </SelectTrigger>
          <SelectContent>
            {colorSets.map((cs) => (
              <SelectItem key={cs.id} value={cs.name}>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cs.color || "#3b82f6" }}></div>
                  {cs.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="initialMarking">Initial Marking</Label>
        <Input
          id="initialMarking"
          value={data?.initialMarking || ""}
          onChange={(e) => updateNodeData(id, { ...data, initialMarking: e.target.value })}
        />
      </div>
    </div>
  );
};

export default PlaceProperties;
