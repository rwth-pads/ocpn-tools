import { memo } from 'react';
import { Handle, Position, NodeResizer, useConnection } from '@xyflow/react';
import { Code } from 'lucide-react';

// Export the interface so it can be imported elsewhere
export interface TransitionNodeData {
  label: string;
  isArcMode: boolean;
  type: string;
  guard: string;
  time: string;
  priority: string;
  codeSegment: string;
}

export interface TransitionNodeProps {
  id: string;
  data: TransitionNodeData;
  selected: boolean;
}

export const TransitionNode: React.FC<TransitionNodeProps> = ({ id, data, selected }) => {
  const connection = useConnection();

  const isTarget = connection.inProgress && connection.fromNode.id !== id && connection.fromNode.type === 'place';

  return (
    <div className="cpn-node transition-node">

      {/* Guard - top left corner */}
      {data.guard && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 top-0 right-full transform -translate-y-4 rounded-md">
          {data.guard}
        </div>
      )}

      {/* Time - top right corner */}
      {data.time && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 top-0 left-full transform -translate-y-4 rounded-md">
          {data.time}
        </div>
      )}

      {/* Code Segment - bottom right corner */}
      {data.codeSegment && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 bottom-0 left-full transform translate-y-4 rounded-md">
          <Code className="h-3 w-3" />
        </div>
      )}

      {/* Priority - bottom left corner */}
      {data.priority && (
        <div className="absolute text-[8px] font-mono bg-background/80 px-1 bottom-0 right-full transform translate-y-4 rounded-md">
          {data.priority}
        </div>
      )}

      <NodeResizer
        isVisible={selected}
        minWidth={15}
        minHeight={30}
      />
      <label htmlFor="text">{data.label}</label>
      <Handle
        className="custom-handle"
        type="source"
        position={Position.Right}
        style={{ visibility: (data.isArcMode && !connection.inProgress) ? 'visible' : 'hidden' }}
      />
      <Handle
        className="custom-handle"
        type="target"
        position={Position.Left}
        style={{ visibility: (data.isArcMode && isTarget) ? 'visible' : 'hidden' }}
        isConnectable={isTarget}
      />
    </div>
  );
};

export default memo(TransitionNode);
