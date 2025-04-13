import { Handle, Position, NodeResizer, useConnection } from '@xyflow/react';
import useStore from '@/stores/store'; // Import Zustand store

// Export the interface so it can be imported elsewhere
export interface PlaceNodeData {
  label: string;
  isArcMode: boolean;
  type: string;
  colorSet: string;
  initialMarking: string;
}

export interface PlaceNodeProps {
  id: string;
  data: PlaceNodeData;
  selected: boolean;
}

export const PlaceNode: React.FC<PlaceNodeProps> = ({ id, data, selected }) => {
  const connection = useConnection();
  const colorSetColor = useStore((state) =>
    state.colorSets.find((colorSet) => colorSet.name === data.colorSet)?.color || '#FBBF24'
  );

  const isTarget = connection.inProgress && connection.fromNode.id !== id && connection.fromNode.type === 'transition';

  return (
    <div className="relative cpn-node place-node" style={{ borderColor: colorSetColor }}>

      {/* Initial marking - top right corner */}
      {data.initialMarking && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 top-0 left-full transform -translate-y-4 rounded-md">
          {data.initialMarking}
        </div>
      )}

      {/* Color set - bottom right corner */}
      {data.colorSet && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 bottom-0 left-full transform translate-y-4 rounded-md">
          {data.colorSet}
        </div>
      )}

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
