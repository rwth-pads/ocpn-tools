import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectedElement } from '@/types'; 

const PlaceProperties = ({ colorSets }) => {
  const selectedElement = useStore((state) => state.selectedElement) as SelectedElement | null;
  const updateNodeData = useStore((state) => state.updateNodeData);

  // Ensure selectedElement is a node and has the correct data type
  if (!selectedElement || selectedElement.type !== 'node' || !selectedElement.element) {
    return <div>No node selected</div>;
  }

  const { id, data } = selectedElement.element;

  // Type guard to ensure data is of type PlaceNodeData
  if (!('colorSet' in data)) {
    return <div>Invalid node type</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={data.label || ""}
          onChange={(e) => updateNodeData(id, { ...data, label: e.target.value })}
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="colorSet">Color Set</Label>
        <Select
          value={data.colorSet || "INT"}
          onValueChange={(value) => {
            const colorSetObj = colorSets.find((cs) => cs.name === value);
            updateNodeData(id, {
              ...data,
              colorSet: value,
              colorSetColor: colorSetObj?.color,
            });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select color set" />
          </SelectTrigger>
          <SelectContent>
            {colorSets.map((cs) => (
              <SelectItem key={cs.id} value={cs.name}>
                <div className="flex items-center">
                  <div
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: cs.color || "#3b82f6" }}
                  ></div>
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
          value={data.initialMarking || ""}
          onChange={(e) => updateNodeData(id, { ...data, initialMarking: e.target.value })}
        />
      </div>
    </div>
  );
};

export default PlaceProperties;
