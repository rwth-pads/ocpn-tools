import { useState, useContext, useCallback } from 'react';
import { Clock, Hash, Settings } from 'lucide-react';
import { EventLog, SimulationEvent } from '@/components/EventLog';
import { OCELExportDialog } from '@/components/dialogs/OCELExportDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
// Correct the import path for SimulationContext
import { SimulationContext, type SimulationConfig } from '@/context/useSimulationContextHook';
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
  places: { id: string; name: string; colorSet: string }[],
  simulationEpoch: string | null
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
  
  // Get epoch for simulation time calculation
  const epochDate = simulationEpoch ? new Date(simulationEpoch) : null;
  
  for (const event of events) {
    const eventId = `e${event.step}`;
    const eventType = event.transitionName;
    // Use simulation time (epoch + event.time) for OCEL export, fallback to wall-clock if no epoch
    const eventTime = epochDate 
      ? new Date(epochDate.getTime() + event.time).toISOString()
      : event.timestamp.toISOString();
    
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
  const { events, clearEvents, isInitialized, stepCounter, simulationTime, simulationConfig, setSimulationConfig } = context;

  // Get model data from store for OCEL export
  const colorSets = useStore((state) => state.colorSets);
  const petriNetsById = useStore((state) => state.petriNetsById);
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const simulationEpoch = useStore((state) => state.simulationEpoch);
  const setSimulationEpoch = useStore((state) => state.setSimulationEpoch);

  const [ocelDialogOpen, setOcelDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<SimulationConfig>(simulationConfig);

  // Convert stored epoch (UTC ISO string) to local datetime string for the input
  const epochToLocal = (epoch: string | null): string => {
    if (!epoch) return '';
    const d = new Date(epoch);
    if (isNaN(d.getTime())) return epoch;
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
  };

  const [tempEpoch, setTempEpoch] = useState<string>(epochToLocal(simulationEpoch));

  // Reset temp config when dialog opens
  const handleSettingsOpen = (open: boolean) => {
    if (open) {
      setTempConfig(simulationConfig);
      setTempEpoch(epochToLocal(simulationEpoch));
    }
    setSettingsOpen(open);
  };

  // Save settings
  const handleSaveSettings = () => {
    setSimulationConfig(tempConfig);
    // Convert naive local datetime to ISO string with timezone offset
    // so the Rust simulator interprets it correctly
    if (tempEpoch) {
      const localDate = new Date(tempEpoch);
      if (!isNaN(localDate.getTime())) {
        setSimulationEpoch(localDate.toISOString()); // Stores as UTC with Z suffix
      } else {
        setSimulationEpoch(tempEpoch); // Fallback: store as-is
      }
    } else {
      setSimulationEpoch(null);
    }
    setSettingsOpen(false);
  };

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
    const ocelData = convertToOCEL2(events, colorSets, transitions, places, simulationEpoch || null);
    
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

  // Format simulation time for display (time is in milliseconds)
  const epoch = simulationEpoch ? new Date(simulationEpoch) : null;
  
  const formatTime = (time: number | undefined) => {
    if (time === undefined || time === null) time = 0;
    
    // If epoch is set, show absolute datetime
    if (epoch) {
      const absoluteDate = new Date(epoch.getTime() + time);
      // Format as short date + time with milliseconds
      const dateStr = absoluteDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
      const timeStr = absoluteDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const ms = absoluteDate.getMilliseconds().toString().padStart(3, '0');
      return `${dateStr}, ${timeStr}.${ms}`;
    }
    
    // No epoch - show relative time
    if (time === 0) return '0ms';
    
    // For small times (< 1 minute), show milliseconds or seconds
    if (time < 1000) {
      return `${time}ms`;
    } else if (time < 60000) {
      const seconds = time / 1000;
      return `${seconds.toFixed(1)}s`;
    } else if (time < 3600000) {
      // Less than 1 hour - show minutes:seconds
      const minutes = Math.floor(time / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    } else {
      // Show hours:minutes:seconds
      const hours = Math.floor(time / 3600000);
      const minutes = Math.floor((time % 3600000) / 60000);
      const seconds = Math.floor((time % 60000) / 1000);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  };

  return (
    <div className="flex flex-col h-full gap-3 overflow-hidden">
      {/* Simulation Status Box */}
      <div className="border border-border rounded-lg p-4 bg-card flex-shrink-0">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold leading-none tracking-tight">Simulation Status</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            title="Simulation Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Step</div>
              <div className="text-lg font-mono font-semibold">{stepCounter ?? 0}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-xs text-muted-foreground">Time</div>
              <div className="text-lg font-mono font-semibold">{formatTime(simulationTime)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Log */}
      <div className="flex-1 overflow-hidden min-h-0">
        <EventLog
          events={events}
          onClearLog={clearEvents}
          onExport={() => setOcelDialogOpen(true)}
          canExport={canExport}
          exportDisabledReason={!isInitialized ? "Simulation not initialized" : events.length === 0 ? "No simulation events to export" : undefined}
        />
      </div>
      <OCELExportDialog open={ocelDialogOpen} onOpenChange={setOcelDialogOpen} onExport={handleExportOcel} />
      
      {/* Simulation Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={handleSettingsOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Simulation Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stepsPerRun" className="text-right col-span-2">
                Steps per run
              </Label>
              <Input
                id="stepsPerRun"
                type="number"
                min={1}
                max={1000}
                value={tempConfig.stepsPerRun}
                onChange={(e) => setTempConfig({ ...tempConfig, stepsPerRun: parseInt(e.target.value) || 1 })}
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="animationDelay" className="text-right col-span-2">
                Animation delay (ms)
              </Label>
              <Input
                id="animationDelay"
                type="number"
                min={0}
                max={5000}
                step={50}
                value={tempConfig.animationDelayMs}
                onChange={(e) => setTempConfig({ ...tempConfig, animationDelayMs: parseInt(e.target.value) || 0 })}
                className="col-span-2"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="simulationEpoch" className="text-right col-span-2">
                Simulation epoch
              </Label>
              <Input
                id="simulationEpoch"
                type="datetime-local"
                step="0.001"
                value={tempEpoch}
                onChange={(e) => setTempEpoch(e.target.value)}
                className="col-span-2"
              />
              <div className="col-span-2 col-start-3 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const now = new Date();
                    // Format as YYYY-MM-DDTHH:MM:SS.mmm in local timezone for datetime-local input
                    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
                    const formatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(now.getMilliseconds(), 3)}`;
                    setTempEpoch(formatted);
                  }}
                >
                  Now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTempEpoch('')}
                >
                  Reset
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              The simulation epoch is the real-world datetime that corresponds to simulation time 0.
              When set, simulation times will be displayed relative to this epoch.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
