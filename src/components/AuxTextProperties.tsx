import useStore from '@/stores/store';

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectedElement } from '@/types';

const AuxTextProperties = () => {
  const selectedElement = useStore((state) => state.selectedElement) as SelectedElement | null;
  const updateNodeData = useStore((state) => state.updateNodeData);

  // Ensure selectedElement is a node and has the correct data type
  if (!selectedElement || selectedElement.type !== 'node' || !selectedElement.element) {
    return <div>No node selected</div>;
  }

  const { id, data }: { id: string; data: { label?: string; type?: string; } } = selectedElement.element;

  return (
    <div className="space-y-4">
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="label">Annotation</Label>
        <Textarea
          id="label"
          placeholder="Annotation"
          className="font-mono h-[100px]"
          value={data.label || ""}
          onChange={
            (e) =>
              updateNodeData(id, {
                ...data,
                label: e.target.value,
                type: data.type || "auxText",
              })
          }
        />
      </div>

    </div>
  );
};

export default AuxTextProperties;
