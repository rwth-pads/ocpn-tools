import { Handle, Position, NodeResizer, useConnection } from '@xyflow/react';

export const PlaceNode = ({ id, data, selected }) => {
  const connection = useConnection();

  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  return (
    <div className="cpn-node place-node">
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
        style={{ visibility: (data.isArcMode && !connection.inProgress) ? 'visible' : 'hidden' }}
      />
      <Handle
        className="custom-handle"
        type="target"
        position={Position.Left}
        style={{ visibility: (data.isArcMode && isTarget) ? 'visible' : 'hidden' }} />
    </div>
  );
};
