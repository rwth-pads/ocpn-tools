import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { SelectedElement } from '@/types';


const ArcProperties = () => {
  const selectedElement = useStore((state) => state.selectedElement) as SelectedElement | null;
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
            updateEdgeLabel(id, e.target.value)
          }}
        />
      </div>
    </div>
  );
}

export default ArcProperties;
