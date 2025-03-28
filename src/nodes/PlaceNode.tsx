import { Handle, Position, NodeResizer } from '@xyflow/react';

export const PlaceNode = ({ id, data, selected }) => {
  return (
    <div className="cpn-node place-node">
      <NodeResizer
        isVisible={selected}
        minWidth={30}
        minHeight={30}
      />
      <label htmlFor="text">{data.label}</label>
      <Handle
        type="source"
        position={Position.Right}
        style={{ visibility: data.isArcMode ? 'visible' : 'hidden' }}
      />
      <Handle type="target" position={Position.Left} style={{ visibility: data.isArcMode ? 'visible' : 'hidden' }} />
    </div>
  );
};
