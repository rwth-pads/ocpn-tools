import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorSet } from '@/declarations';

const PlaceProperties = ({ colorSets }: { colorSets: ColorSet[] }) => {
  // Access selectedElement from the store
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const selectedElement = useStore((state) => {
    const activePetriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return activePetriNet?.selectedElement;
  });
  const updateNodeData = useStore((state) => state.updateNodeData);

  // Ensure selectedElement is a node and has the correct data type
  if (!selectedElement || selectedElement.type !== 'node' || !selectedElement.element) {
    return <div>No node selected</div>;
  }

  const { id, data }: { id: string; data: { label?: string; colorSet?: string; isArcMode?: boolean; type?: string; initialMarking?: string } } = selectedElement.element;

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
          onChange={(e) => {
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, {
                ...data,
                label: e.target.value,
                isArcMode: data.isArcMode || false,
                type: data.type || "node",
                colorSet: data.colorSet || "INT",
                initialMarking: data.initialMarking || "",
              });
            }
          }
          }
        />
      </div>

      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="colorSet">Color Set</Label>
        <Select
          value={data.colorSet || "INT"}
          onValueChange={(value) => {
            // const colorSetObj = colorSets.find((cs) => cs.name === value);
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, {
                ...data,
                label: data.label || "",
                colorSet: value,
                isArcMode: data.isArcMode || false,
                type: data.type || "node",
                initialMarking: data.initialMarking || "",
              });
            }
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
          onChange={(e) => {
            if (activePetriNetId) {
              updateNodeData(activePetriNetId, id, {
                ...data,
                label: data.label || "",
                initialMarking: e.target.value,
                isArcMode: data.isArcMode || false,
                type: data.type || "defaultType",
                colorSet: data.colorSet || "defaultColorSet",
              });
            }
          }
          }
        />
      </div>
    </div>
  );
};

export default PlaceProperties;
