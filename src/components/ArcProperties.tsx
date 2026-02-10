import useStore from '@/stores/store';
import type { ArcType } from '@/types';

import { Label } from "@/components/ui/label";
import { UndoableTextarea as Textarea } from "@/components/ui/undoable-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ArcDirection = 'source-to-target' | 'target-to-source' | 'bidirectional';

const ArcProperties = () => {
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const petriNetsById = useStore((state) => state.petriNetsById);
  const selectedElement = useStore((state) => {
    const activePetriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return activePetriNet?.selectedElement;
  });
  const updateEdgeLabel = useStore((state) => state.updateEdgeLabel);
  const updateEdgeData = useStore((state) => state.updateEdgeData);
  const swapEdgeDirection = useStore((state) => state.swapEdgeDirection);

  if (!selectedElement) {
    return null;
  }

  // check if selectedElement is an edge
  if (selectedElement.type !== "edge") {
    return null;
  }

  const { id, label, source, target, data } = selectedElement.element;
  const isBidirectional = (data as { isBidirectional?: boolean })?.isBidirectional ?? false;
  const arcType: ArcType = (data as { arcType?: ArcType })?.arcType ?? 'normal';

  // Get node names for display
  const getNodeName = (nodeId: string): string => {
    if (!activePetriNetId) return nodeId;
    const petriNet = petriNetsById[activePetriNetId];
    if (!petriNet) return nodeId;
    const node = petriNet.nodes.find(n => n.id === nodeId);
    return (node?.data?.label as string) || nodeId;
  };

  // Get node type (place or transition)
  const getNodeType = (nodeId: string): string => {
    if (!activePetriNetId) return 'unknown';
    const petriNet = petriNetsById[activePetriNetId];
    if (!petriNet) return 'unknown';
    const node = petriNet.nodes.find(n => n.id === nodeId);
    return node?.type || 'unknown';
  };

  const sourceName = getNodeName(source);
  const targetName = getNodeName(target);
  const sourceType = getNodeType(source);

  // Determine current direction value for dropdown
  const getCurrentDirection = (): ArcDirection => {
    if (isBidirectional) return 'bidirectional';
    // Source to target is the default direction
    return 'source-to-target';
  };

  const handleDirectionChange = (newDirection: ArcDirection) => {
    if (!activePetriNetId) return;

    const currentDirection = getCurrentDirection();
    
    if (newDirection === currentDirection) return;

    if (newDirection === 'bidirectional') {
      // Make it bidirectional
      updateEdgeData(activePetriNetId, id, { isBidirectional: true });
    } else if (currentDirection === 'bidirectional') {
      // Was bidirectional, now making it unidirectional
      updateEdgeData(activePetriNetId, id, { isBidirectional: false });
      if (newDirection === 'target-to-source') {
        // Swap direction
        swapEdgeDirection(activePetriNetId, id);
      }
    } else {
      // Swapping between source-to-target and target-to-source
      swapEdgeDirection(activePetriNetId, id);
    }
  };

  const handleArcTypeChange = (newType: ArcType) => {
    if (!activePetriNetId) return;
    const newData: Record<string, unknown> = { arcType: newType };
    // Reset bidirectional when switching to inhibitor/reset (they only go P→T)
    if (newType !== 'normal' && isBidirectional) {
      newData.isBidirectional = false;
    }
    updateEdgeData(activePetriNetId, id, newData);
    // Clear inscription for inhibitor/reset arcs
    if (newType !== 'normal') {
      updateEdgeLabel(activePetriNetId, id, '');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="arcType">Arc Type</Label>
        <Select value={arcType} onValueChange={(value) => handleArcTypeChange(value as ArcType)}>
          <SelectTrigger id="arcType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="inhibitor">Inhibitor</SelectItem>
            <SelectItem value="reset">Reset</SelectItem>
          </SelectContent>
        </Select>
        {arcType === 'inhibitor' && (
          <p className="text-xs text-muted-foreground">
            Transition enabled only when place is empty
          </p>
        )}
        {arcType === 'reset' && (
          <p className="text-xs text-muted-foreground">
            Removes all tokens from place when transition fires
          </p>
        )}
      </div>

      {arcType === 'normal' && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="direction">Direction</Label>
          <Select value={getCurrentDirection()} onValueChange={(value) => handleDirectionChange(value as ArcDirection)}>
            <SelectTrigger id="direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="source-to-target">
                {sourceName} → {targetName}
              </SelectItem>
              <SelectItem value="target-to-source">
                {targetName} → {sourceName}
              </SelectItem>
              <SelectItem value="bidirectional">
                Bidirectional
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {sourceType === 'place' ? 'Place → Transition' : 'Transition → Place'}
          </p>
        </div>
      )}

      {arcType === 'normal' && (
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="inscription">Inscription</Label>
          <Textarea
            id="inscription"
            value={label as string ?? ""}
            rows={3}
            className="font-mono text-sm"
            onChange={(e) => {
              if (activePetriNetId) {
                updateEdgeLabel(activePetriNetId, id, e.target.value)
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export default ArcProperties;
