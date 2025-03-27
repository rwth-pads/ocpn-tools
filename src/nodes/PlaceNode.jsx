import React from 'react';
import { Handle, Position } from '@xyflow/react';

export const PlaceNode = ({ data }) => {
  return (
    <div className="cpn-node place-node">
      <Handle type="source" position={Position.Right} />
      <label htmlFor="text">{data.label}</label>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};
