import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const TransitionNode = ({ data, selected }) => {
  return (
    <div className="cpn-node transition-node">
      <NodeResizer
        isVisible={selected}
        minWidth={15}
        minHeight={30}
      />
      <label htmlFor="text">{data.label}</label>
      {/* Source Handle with visibility toggled */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: data.isArcMode ? 'visible' : 'hidden' }}
      />
      {/* Target Handle with visibility toggled */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ visibility: data.isArcMode ? 'visible' : 'hidden' }}
      />
    </div>
  );
};

export default memo(TransitionNode);
