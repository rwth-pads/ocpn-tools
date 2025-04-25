import { Handle, Position, NodeResizer, useConnection } from '@xyflow/react';
import useStore from '@/stores/store'; // Import Zustand store

// Export the interface so it can be imported elsewhere
export interface PlaceNodeData {
  label: string;
  isArcMode: boolean;
  type: string;
  colorSet: string;
  initialMarking: string;
  marking: string;
}

export interface PlaceNodeProps {
  id: string;
  data: PlaceNodeData;
  selected: boolean;
}

export const PlaceNode: React.FC<PlaceNodeProps> = ({ id, data, selected }) => {
  const connection = useConnection();
  const colorSetColor = useStore((state) =>
    state.colorSets.find((colorSet) => colorSet.name === data.colorSet)?.color || '#000000'
  );
  let displayedMarking = undefined;

  const isTarget = connection.inProgress && connection.fromNode.id !== id && connection.fromNode.type === 'transition';

  if (data.marking && data.marking.length > 0) {
    try {
      if (data.marking.length > 5) {
        displayedMarking = `[#${data.marking.length}]`;
      } else {
        displayedMarking = JSON.stringify(data.marking);
      }
    } catch {
      console.error('Invalid JSON in marking:', data.marking);
    }
  }

  return (
    <div className="relative cpn-node place-node" style={{ borderColor: colorSetColor }}>

      {/* Initial marking - top right corner */}
      {data.initialMarking && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 top-0 left-full transform -translate-y-2 rounded-md whitespace-nowrap">
          {data.initialMarking}
        </div>
      )}

      {/* Color set - bottom right corner */}
      {data.colorSet && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 bottom-0 left-full transform translate-y-2 rounded-md">
          {data.colorSet}
        </div>
      )}

      {/* Marking - middle right */}
      {displayedMarking && (
        <div className="marking absolute text-[8px] font-mono bg-background/80 px-1 top-1/2 left-full transform -translate-y-1/2 rounded-md whitespace-nowrap">
          {displayedMarking}
        </div>
      )}

      {/* Label */}

      <NodeResizer
        isVisible={selected}
        minWidth={30}
        minHeight={30}
      />

      <label htmlFor="text">{data.label}</label>

      <Handle
        className="custom-handle"
        type="source"
        position={Position.Right}
        style={{ visibility: data.isArcMode && !connection.inProgress ? 'visible' : 'hidden' }}
      />
      <Handle
        className="custom-handle"
        type="target"
        position={Position.Left}
        style={{ visibility: data.isArcMode && isTarget ? 'visible' : 'hidden' }}
        isConnectable={isTarget}
      />
    </div>
  );
};
