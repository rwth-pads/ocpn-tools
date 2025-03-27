import React from 'react';
import { getStraightPath } from '@xyflow/react';
 
interface ConnectionLineComponentProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  connectionLineStyle?: React.CSSProperties;
}

const CustomConnectionLine: React.FC<ConnectionLineComponentProps> = ({ fromX, fromY, toX, toY, connectionLineStyle }) => {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });
 
  return (
    <g>
      <path style={connectionLineStyle || { stroke: 'black', strokeWidth: 2 }} fill="none" d={edgePath} />
    </g>
  );
}
 
export default CustomConnectionLine;
