import { useState, useMemo } from "react";
import useStore from '@/stores/store';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Plus, Box, Globe } from "lucide-react"
import { AttributeTimeline } from '@/components/OELAttributeTimeline';
import { ValueChangeDialog } from '@/components/dialogs/OELValueChangeDialog';
import { AddAttributeDialog } from '@/components/dialogs/OELAddAttributeDialog';
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Attribute {
  id: string
  name: string
  type: "string" | "int" | "boolean" | "real"
  initialValue: string | number | boolean
}

export interface ObjectType {
  id: string
  name: string
  attributes: Attribute[]
}

export interface ValueChange {
  id: string
  attributeId: string
  timestamp: number
  operation: string
  value: string | number | boolean
}

interface ObjectEvolutionPanelProps {
  simulationTimeRange: [number, number]
}

export function ObjectEvolutionPanel({ simulationTimeRange }: ObjectEvolutionPanelProps) {
  // State for global context and object types
  const [globalContext, setGlobalContext] = useState<Attribute[]>([
    // { id: "global-1", name: "processId", type: "string", initialValue: "PROC-001" },
    { id: "global-tax", name: "Sales Tax", type: "real", initialValue: 19.5 },
  ])

  // Extract object types from colorSets (only those of type "record")
  const colorSets = useStore((state) => state.colorSets);

  // State for value changes
  const [valueChanges, setValueChanges] = useState<ValueChange[]>([
    {
      id: "change-1",
      attributeId: "global-1",
      timestamp: 10,
      operation: "set",
      value: "PROC-002",
    },
    {
      id: "change-2",
      attributeId: "global-2",
      timestamp: 25,
      operation: "add",
      value: 50,
    },
  ])

  // Dialog states
  const [isValueChangeDialogOpen, setIsValueChangeDialogOpen] = useState(false)
  const [isAddAttributeDialogOpen, setIsAddAttributeDialogOpen] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [selectedChange, setSelectedChange] = useState<ValueChange | null>(null)
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null)

  // Extract object types from colorSets
  const objectTypes = useMemo<ObjectType[]>(() => {
    const recordColorSets = colorSets.filter((cs) => cs.type === "record" || cs.type === "complex"); // Include complex as they might be records

    return recordColorSets
      .filter((cs): cs is typeof cs & { id: string; definition: string } =>
        typeof cs.id === 'string' && typeof cs.definition === 'string' && cs.definition.includes("record")
      ) // Ensure cs.id and cs.definition are strings and it's a record
      .map((cs) => {
        const attributes: Attribute[] = [];
        const definition = cs.definition;

        // Find the part after 'record' and before the closing ';'
        const recordMatch = definition.match(/record\s+(.*);/);

        if (recordMatch && recordMatch[1]) {
          const fieldsString = recordMatch[1].trim();
          const fieldPairs = fieldsString.split('*'); // Split fields by '*'

          fieldPairs.forEach((pair, index) => {
            const parts = pair.split(':'); // Split name and type by ':'
            if (parts.length === 2) {
              const name = parts[0].trim();
              // Strip 'timed' suffix if present (e.g., "INT timed" → "INT")
              const typeString = parts[1].trim().replace(/\s+timed$/i, '');

              // Map CPN Tools types to Attribute types
              let type: Attribute["type"] = "string"; // Default type
              switch (typeString.toUpperCase()) {
                case "INT":
                  type = "int";
                  break;
                case "STRING":
                  type = "string";
                  break;
                case "BOOL":
                  type = "boolean";
                  break;
                case "REAL":
                  type = "real";
                  break;
                // Add other CPN Tools type mappings if needed
                default:
                  console.warn(`Unknown attribute type "${typeString}" in definition: ${definition}. Defaulting to string.`);
              }

              attributes.push({
                id: `${cs.id}-attr-${index}`, // Generate unique ID
                name: name,
                type: type,
                initialValue: "", // Set a default initial value as requested
              });
            } else {
              console.warn(`Could not parse attribute pair: "${pair}" in definition: ${definition}`);
            }
          });
        } else {
           // Handle cases where the definition might not be a standard record
           // or parsing fails. Could be a simple alias or other complex type.
           console.warn(`Could not parse record attributes from definition: ${definition}`);
           // Optionally, you could try other parsing logic here if needed
        }


        return {
          id: cs.id,
          name: cs.name,
          attributes,
        };
      });
  }, [colorSets]);

  // State for value changes

  // Handle opening the value change dialog
  const handleOpenValueChangeDialog = (attribute: Attribute, timestamp: number, existingChange?: ValueChange) => {
    setSelectedAttribute(attribute)
    setSelectedTimestamp(timestamp)
    setSelectedChange(existingChange || null)
    setIsValueChangeDialogOpen(true)
  }

  // Handle saving a value change
  const handleSaveValueChange = (change: ValueChange) => {
    if (selectedChange) {
      // Update existing change
      setValueChanges((prev) => prev.map((c) => (c.id === selectedChange.id ? change : c)))
    } else {
      // Add new change
      setValueChanges((prev) => [...prev, change])
    }
    setIsValueChangeDialogOpen(false)
  }

  // Handle deleting a value change
  const handleDeleteValueChange = (changeId: string) => {
    setValueChanges((prev) => prev.filter((c) => c.id !== changeId))
    setIsValueChangeDialogOpen(false)
  }

  // Handle adding a new global attribute
  const handleAddGlobalAttribute = (attribute: Attribute) => {
    setGlobalContext((prev) => [...prev, attribute])
    setIsAddAttributeDialogOpen(false)
  }

  return (
    <ScrollArea className="h-full">
      <Card className="w-full border-none shadow-none gap-0">
        <CardHeader>
          <CardTitle>Object Evolution Layer</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={["global-context"]}>
            {/* Global Context */}
            <AccordionItem value="global-context">
              <AccordionTrigger className="flex items-center">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Global Context</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {globalContext.map((attribute) => (
                    <AttributeTimeline
                      key={attribute.id}
                      attribute={attribute}
                      timeRange={simulationTimeRange}
                      valueChanges={valueChanges.filter((c) => c.attributeId === attribute.id)}
                      onAddChange={(timestamp) => handleOpenValueChangeDialog(attribute, timestamp)}
                      onEditChange={(change) => handleOpenValueChangeDialog(attribute, change.timestamp, change)}
                    />
                  ))}

                  <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsAddAttributeDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Attribute
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Object Types */}
            {objectTypes.map((objectType) => (
              <AccordionItem key={objectType.id} value={objectType.id}>
                <AccordionTrigger className="flex items-center">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4" />
                    <span>{objectType.name}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    {objectType.attributes.map((attribute) => (
                      <AttributeTimeline
                        key={attribute.id}
                        attribute={attribute}
                        timeRange={simulationTimeRange}
                        valueChanges={valueChanges.filter((c) => c.attributeId === attribute.id)}
                        onAddChange={(timestamp) => handleOpenValueChangeDialog(attribute, timestamp)}
                        onEditChange={(change) => handleOpenValueChangeDialog(attribute, change.timestamp, change)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      {/* Dialogs */}
      {selectedAttribute && (
        <ValueChangeDialog
          open={isValueChangeDialogOpen}
          onOpenChange={setIsValueChangeDialogOpen}
          attribute={selectedAttribute}
          timestamp={selectedTimestamp || 0}
          existingChange={selectedChange}
          onSave={handleSaveValueChange}
          onDelete={selectedChange ? () => handleDeleteValueChange(selectedChange.id) : undefined}
        />
      )}

      <AddAttributeDialog
        open={isAddAttributeDialogOpen}
        onOpenChange={setIsAddAttributeDialogOpen}
        onAdd={handleAddGlobalAttribute}
      />
    </ScrollArea>
  )
}
