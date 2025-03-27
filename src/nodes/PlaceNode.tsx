import React from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

export const PlaceNode = ({ data, selected }) => {
  return (
    <div className="cpn-node place-node">
      <NodeResizer
        isVisible={selected}
        minWidth={30}
        minHeight={30}
      />
      <Handle type="source" position={Position.Right} />
      <label htmlFor="text">{data.label}</label>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};
