import React, { memo } from 'react';
import { Handle, Position, NodeResizer, useConnection } from '@xyflow/react';

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

      <NodeResizer
        isVisible={selected}
        minWidth={15}
        minHeight={30}
      />
      
      {/* Static Label */}
      <div className="whitespace-pre-wrap leading-tight">
        {data.label}
      </div>
      
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
