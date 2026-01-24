import { useState } from 'react';
import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { RecordMarkingDialog } from '@/components/dialogs/RecordMarkingDialog';
import { ColorSet } from '@/declarations';

// Define the type for the values within a parsed record
type RecordValue = string | number | boolean;
// Define the type for a single parsed record
type ParsedRecord = Record<string, RecordValue>;

// Define the type for the data part of the selected place
interface SelectedPlaceData {
  label?: string;
  colorSet?: string;
  isArcMode?: boolean;
  type?: string;
  initialMarking?: string;
}

// Define the type for the selected place state
interface SelectedPlace {
  id: string;
  data: SelectedPlaceData;
}

const PlaceProperties = ({ colorSets }: { colorSets: ColorSet[] }) => {
  const [isRecordMarkingDialogOpen, setIsRecordMarkingDialogOpen] = useState(false);
  // Use the specific type for the selectedPlace state
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);

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

  // Use the specific type here as well, although it's inferred correctly
  const { id, data }: { id: string; data: SelectedPlaceData } = selectedElement.element;

  // Type guard to ensure data is of type PlaceNodeData
  if (!('colorSet' in data)) {
    return <div>Invalid node type</div>;
  }

  // Helper function to get record attributes
  const getRecordAttributes = (colorSetName: string) => {
    const colorSet = colorSets.find((cs) => cs.name === colorSetName)
    if (!colorSet || colorSet.type !== "record") return []

    // In a real implementation, parse the record definition
    // For now, we'll use a simplified approach for the demo
    if (colorSetName === "Product") {
      return [
        { name: "id", type: "INT" },
        { name: "name", type: "STRING" },
        { name: "price", type: "REAL" },
      ]
    } else if (colorSetName === "Order") {
      return [
        { name: "orderId", type: "STRING" },
        { name: "status", type: "STRING" },
        { name: "amount", type: "INT" },
      ]
    }

    // Try to parse from the definition
    try {
      const recordRegex = /colset\s+(\w+)\s*=\s*record\s+([^;]+);/i
      const fieldsRegex = /(\w+)\s*:\s*(\w+)/g

      const match = colorSet.definition.match(recordRegex)
      if (!match) return []

      const fields = match[2]
      const attributes = []
      let fieldMatch

      while ((fieldMatch = fieldsRegex.exec(fields)) !== null) {
        attributes.push({
          name: fieldMatch[1],
          type: fieldMatch[2].toUpperCase(),
        })
      }

      return attributes
    } catch (error) {
      console.error("Failed to parse record definition:", error)
      return []
    }
  }

  // Helper function to parse initial marking
  const parseInitialMarking = (initialMarking: string): ParsedRecord[] => {
    if (!initialMarking) return []

    try {
      // Try to parse as JSON first
      if (initialMarking.trim().startsWith("[")) {
        // Assuming JSON structure matches ParsedRecord[]
        return JSON.parse(initialMarking) as ParsedRecord[];
      }

      // If not JSON, try to parse as CPN Tools format
      const regex = /(\d+)`\{([^}]+)\}/g
      const records: ParsedRecord[] = []
      let match

      while ((match = regex.exec(initialMarking)) !== null) {
        const count = Number.parseInt(match[1], 10)
        const recordStr = match[2]

        // Parse record attributes
        const attrRegex = /(\w+)=([^,]+)(?:,|$)/g
        const record: ParsedRecord = {}
        let attrMatch

        while ((attrMatch = attrRegex.exec(recordStr)) !== null) {
          let value: string | number | boolean = attrMatch[2].trim()
          const key = attrMatch[1];

          // Try to convert to appropriate type
          if (!isNaN(Number(value))) {
            if (value.includes(".")) {
              record[key] = Number.parseFloat(value)
            } else {
              record[key] = Number.parseInt(value, 10)
            }
          } else if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
            record[key] = value.toLowerCase() === "true"
          } else {
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1)
            }
            record[key] = value
          }
        }

        // Add the record multiple times based on count
        for (let i = 0; i < count; i++) {
          records.push({ ...record })
        }
      }

      return records
    } catch (error) {
      console.error("Failed to parse initial marking:", error)
      return []
    }
  }

  // Helper function to format record marking
  const formatRecordMarking = (records: ParsedRecord[]) => {
    if (!records || records.length === 0) return ""

    try {
      // For simplicity, we'll return as JSON string
      // In a real implementation, you might format it according to CPN Tools syntax
      return JSON.stringify(records)
    } catch (error) {
      console.error("Failed to format record marking:", error)
      return ""
    }
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
        <div className="flex gap-2">
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
          <Button
            variant="outline"
            onClick={() => {
              // Ensure data conforms to SelectedPlaceData when setting state
              setSelectedPlace({ id, data: { ...data } });
              setIsRecordMarkingDialogOpen(true);
            }}
          >
            Edit
          </Button>
        </div>
      </div>

      {
        selectedPlace && (
          <RecordMarkingDialog
            open={isRecordMarkingDialogOpen}
            onOpenChange={setIsRecordMarkingDialogOpen}
            // Access properties safely using optional chaining or ensure selectedPlace is not null
            colorSetName={selectedPlace.data?.colorSet || ""}
            attributes={getRecordAttributes(selectedPlace.data?.colorSet || "")}
            initialData={parseInitialMarking(selectedPlace.data?.initialMarking || "")}
            onSave={(records) => {
              const formattedMarking = formatRecordMarking(records);
              // Ensure selectedPlace is not null before accessing its properties
              if (activePetriNetId && selectedPlace) {
                // Ensure all required fields for PlaceNodeData are provided
                updateNodeData(activePetriNetId, selectedPlace.id, {
                  label: selectedPlace.data.label || "",
                  isArcMode: selectedPlace.data.isArcMode || false,
                  type: selectedPlace.data.type || "place", // Assuming 'place' type for PlaceNode
                  colorSet: selectedPlace.data.colorSet || "INT",
                  initialMarking: formattedMarking,
                  marking: formattedMarking // Add the missing 'marking' property
                });
              }
            }}
          />
        )
      }

    </div>
  );
};

export default PlaceProperties;
