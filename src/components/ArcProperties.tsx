import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const ArcProperties = () => {
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const selectedElement = useStore((state) => {
    const activePetriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return activePetriNet?.selectedElement;
  });
  const updateEdgeLabel = useStore((state) => state.updateEdgeLabel);

  if (!selectedElement) {
    return null;
  }

  // check if selectedElement is an edge
  if (selectedElement.type !== "edge") {
    return null;
  }

  const { id, label } = selectedElement.element;

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="inscription">Inscription</Label>
        <Input
          id="inscription"
          value={label as string ?? ""}
          onChange={(e) => {
            if (activePetriNetId) {
              updateEdgeLabel(activePetriNetId, id, e.target.value)
            }
          }}
        />
      </div>
    </div>
  );
}

export default ArcProperties;
