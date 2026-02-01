import { useState, useContext, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { EventLog, SimulationEvent } from '@/components/EventLog';
import { OCELExportDialog } from '@/components/dialogs/OCELExportDialog';
// Correct the import path for SimulationContext
import { SimulationContext } from '@/context/useSimulationContextHook';
import useStore from '@/stores/store';

// OCEL 2.0 Types
interface OCEL2ObjectType {
  name: string;
  attributes: { name: string; type: string }[];
}

interface OCEL2EventType {
  name: string;
  attributes: { name: string; type: string }[];
}

interface OCEL2Object {
  id: string;
  type: string;
  attributes: { name: string; time: string; value: string }[];
  relationships: { objectId: string; qualifier: string }[];
}

interface OCEL2Event {
  id: string;
  type: string;
  time: string;
  attributes: { name: string; value: string }[];
  relationships: { objectId: string; qualifier: string }[];
}

interface OCEL2Export {
  objectTypes: OCEL2ObjectType[];
  eventTypes: OCEL2EventType[];
  objects: OCEL2Object[];
  events: OCEL2Event[];
}

/**
 * Extract the ID value from a token if it has an 'id' or 'ID' field
 */
function extractIdFromToken(token: unknown): string | number | null {
  if (token && typeof token === 'object') {
    const record = token as Record<string, unknown>;
    if ('id' in record) return record.id as string | number;
    if ('ID' in record) return record.ID as string | number;
  }
  return null;
}

/**
 * Generate a unique object ID from a token's content and its type
 * Includes the type prefix to avoid collisions between different object types
 */
function generateObjectId(token: unknown, typeName: string): string {
  const typePrefix = typeName.toLowerCase();
  // Try to use an 'id' or 'ID' field if present
  const idValue = extractIdFromToken(token);
  if (idValue !== null) {
    return `${typePrefix}_${idValue}`;
  }
  // Fallback: use stringified content hash
  const hash = JSON.stringify(token).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${typePrefix}_${Math.abs(hash)}`;
}

/**
 * Convert simulation events and model data to OCEL 2.0 format
 */
function convertToOCEL2(
  events: SimulationEvent[],
  colorSets: { name: string; type: string; definition: string }[],
  transitions: { id: string; name: string }[],
  places: { id: string; name: string; colorSet: string }[]
): OCEL2Export {
  // Build ObjectTypes from Record ColorSets
  const objectTypes: OCEL2ObjectType[] = [];
  const recordColorSets = colorSets.filter(cs => cs.type === 'record');
  
  for (const cs of recordColorSets) {
    // Parse record fields from definition like "colset OBJECT = record id: INT * name: STRING * age: INT;"
    const attributes: { name: string; type: string }[] = [];
    const recordMatch = cs.definition.match(/=\s*record\s+(.+);/);
    if (recordMatch) {
      const fieldsStr = recordMatch[1];
      const fields = fieldsStr.split('*').map(f => f.trim());
      for (const field of fields) {
        const [name, type] = field.split(':').map(s => s.trim());
        // Skip the 'id' field - it's used as the object identifier, not an attribute
        if (name && type && name.toLowerCase() !== 'id') {
          attributes.push({ name: name.toLowerCase(), type: type.toLowerCase() });
        }
      }
    }
    objectTypes.push({ name: cs.name, attributes });
  }
  
  // Build EventTypes from transitions
  const eventTypes: OCEL2EventType[] = transitions.map(t => ({
    name: t.name || t.id,
    attributes: [] // Transitions don't have custom attributes in our model yet
  }));
  
  // Build a map from place ID to its ColorSet
  const placeColorSetMap = new Map<string, string>();
  for (const place of places) {
    placeColorSetMap.set(place.id, place.colorSet);
  }
  
  // Track unique objects by their generated ID
  const objectsMap = new Map<string, OCEL2Object>();
  
  // Build Events and extract Objects
  const ocelEvents: OCEL2Event[] = [];
  
  for (const event of events) {
    const eventId = `e${event.step}`;
    const eventType = event.transitionName;
    const eventTime = event.timestamp.toISOString();
    
    // Track unique objects involved in this event (to avoid duplicates)
    // Map objectId -> colorSetName (for qualifier)
    const involvedObjects = new Map<string, string>();
    
    // Process consumed tokens
    for (const consumed of event.tokens.consumed) {
      const colorSetName = placeColorSetMap.get(consumed.placeId);
      const isRecordType = recordColorSets.some(cs => cs.name === colorSetName);
      
      if (isRecordType && colorSetName) {
        try {
          const tokens = JSON.parse(consumed.tokens);
          if (Array.isArray(tokens)) {
            for (const token of tokens) {
              const objectId = generateObjectId(token, colorSetName);
              
              // Add object if not already tracked
              if (!objectsMap.has(objectId)) {
                const attributes: { name: string; time: string; value: string }[] = [];
                if (token && typeof token === 'object') {
                  for (const [key, value] of Object.entries(token)) {
                    // Skip the id field as it's already used as object id
                    if (key.toLowerCase() === 'id') continue;
                    attributes.push({
                      name: key.toLowerCase(),
                      time: eventTime,
                      value: String(value)
                    });
                  }
                }
                objectsMap.set(objectId, {
                  id: objectId,
                  type: colorSetName,
                  attributes,
                  relationships: [] // No object-to-object relations yet
                });
              }
              
              // Track this object as involved in this event (with its type)
              involvedObjects.set(objectId, colorSetName);
            }
          }
        } catch {
          // Skip if tokens can't be parsed
        }
      }
    }
    
    // Process produced tokens
    for (const produced of event.tokens.produced) {
      const colorSetName = placeColorSetMap.get(produced.placeId);
      const isRecordType = recordColorSets.some(cs => cs.name === colorSetName);
      
      if (isRecordType && colorSetName) {
        try {
          const tokens = JSON.parse(produced.tokens);
          if (Array.isArray(tokens)) {
            for (const token of tokens) {
              const objectId = generateObjectId(token, colorSetName);
              
              // Add object if not already tracked
              if (!objectsMap.has(objectId)) {
                const attributes: { name: string; time: string; value: string }[] = [];
                if (token && typeof token === 'object') {
                  for (const [key, value] of Object.entries(token)) {
                    // Skip the id field as it's already used as object id
                    if (key.toLowerCase() === 'id') continue;
                    attributes.push({
                      name: key.toLowerCase(),
                      time: eventTime,
                      value: String(value)
                    });
                  }
                }
                objectsMap.set(objectId, {
                  id: objectId,
                  type: colorSetName,
                  attributes,
                  relationships: []
                });
              }
              
              // Track this object as involved in this event (with its type)
              involvedObjects.set(objectId, colorSetName);
            }
          }
        } catch {
          // Skip if tokens can't be parsed
        }
      }
    }
    
    // Create relationships from unique involved objects with type-based qualifiers
    const relationships = Array.from(involvedObjects.entries()).map(([objectId, typeName]) => ({
      objectId,
      qualifier: typeName.toLowerCase()
    }));
    
    ocelEvents.push({
      id: eventId,
      type: eventType,
      time: eventTime,
      attributes: [],
      relationships
    });
  }
  
  return {
    objectTypes,
    eventTypes,
    objects: Array.from(objectsMap.values()),
    events: ocelEvents
  };
}

export function SimulationPanel() {
  // Consume context instead of calling the hook
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('SimulationPanel must be used within a SimulationProvider');
  }
  const { events, clearEvents, isInitialized, stepCounter } = context;

  // Get model data from store for OCEL export
  const colorSets = useStore((state) => state.colorSets);
  const petriNetsById = useStore((state) => state.petriNetsById);
  const activePetriNetId = useStore((state) => state.activePetriNetId);

  const [ocelDialogOpen, setOcelDialogOpen] = useState(false);

  // Get transitions and places from active Petri net
  const getModelData = useCallback(() => {
    if (!activePetriNetId) return { transitions: [], places: [] };
    
    const petriNet = petriNetsById[activePetriNetId];
    if (!petriNet) return { transitions: [], places: [] };
    
    const transitions = petriNet.nodes
      .filter(node => node.type === 'transition')
      .map(node => ({
        id: node.id,
        name: (node.data?.label as string) || node.id
      }));
    
    const places = petriNet.nodes
      .filter(node => node.type === 'place')
      .map(node => ({
        id: node.id,
        name: (node.data?.label as string) || node.id,
        colorSet: (node.data?.colorSet as string) || ''
      }));
    
    return { transitions, places };
  }, [activePetriNetId, petriNetsById]);

  const handleExportOcel = (format: 'json' | 'xml' | 'sqlite') => {
    const { transitions, places } = getModelData();
    const ocelData = convertToOCEL2(events, colorSets, transitions, places);
    
    let content = "";
    let filename = `simulation_ocel2_${stepCounter}_events`;
    let mimeType = "application/octet-stream";

    switch (format) {
      case "json":
        content = JSON.stringify(ocelData, null, 2);
        filename += ".json";
        mimeType = "application/json";
        break;
      case "xml":
        // Generate XML from OCEL data
        content = `<?xml version="1.0" encoding="UTF-8"?>
<ocel>
  <objectTypes>
${ocelData.objectTypes.map(ot => `    <objectType name="${ot.name}">
${ot.attributes.map(a => `      <attribute name="${a.name}" type="${a.type}"/>`).join('\n')}
    </objectType>`).join('\n')}
  </objectTypes>
  <eventTypes>
${ocelData.eventTypes.map(et => `    <eventType name="${et.name}">
${et.attributes.map(a => `      <attribute name="${a.name}" type="${a.type}"/>`).join('\n')}
    </eventType>`).join('\n')}
  </eventTypes>
  <objects>
${ocelData.objects.map(obj => `    <object id="${obj.id}" type="${obj.type}">
${obj.attributes.map(a => `      <attribute name="${a.name}" time="${a.time}" value="${a.value}"/>`).join('\n')}
    </object>`).join('\n')}
  </objects>
  <events>
${ocelData.events.map(evt => `    <event id="${evt.id}" type="${evt.type}" time="${evt.time}">
${evt.relationships.map(r => `      <relationship objectId="${r.objectId}" qualifier="${r.qualifier}"/>`).join('\n')}
    </event>`).join('\n')}
  </events>
</ocel>`;
        filename += ".xml";
        mimeType = "application/xml";
        break;
      case "sqlite":
        content = "SQLite format not yet implemented - please use JSON or XML format";
        filename += ".txt";
        mimeType = "text/plain";
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setOcelDialogOpen(false);
  };

  const canExport = isInitialized && events.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <EventLog
          events={events}
          onClearLog={clearEvents}
        />
      </div>
      <div className="flex justify-end mt-2">
        <Button
          variant="outline"
          onClick={() => setOcelDialogOpen(true)}
          className="flex items-center gap-2"
          disabled={!canExport}
          title={!isInitialized ? "Simulation not initialized" : events.length === 0 ? "No simulation events to export" : "Export simulation log as OCEL 2.0"}
        >
          <Database className="h-4 w-4" />
          Export as OCEL 2.0
        </Button>
      </div>
      <OCELExportDialog open={ocelDialogOpen} onOpenChange={setOcelDialogOpen} onExport={handleExportOcel} />
    </div>
  );
}
