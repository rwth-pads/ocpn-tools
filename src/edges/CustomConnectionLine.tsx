import React from 'react';
import { getStraightPath } from '@xyflow/react';

interface ConnectionLineComponentProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  connectionLineStyle?: React.CSSProperties;
  label?: string; // Optional label for the connection line
}

const CustomConnectionLine: React.FC<ConnectionLineComponentProps> = ({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
  label,
}) => {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  // Calculate the midpoint for the label
  const midX = (fromX + toX) / 2;
  const midY = (fromY + toY) / 2;

  return (
    <g>
      {/* Edge Path */}
      <path
        style={connectionLineStyle || { stroke: 'black', strokeWidth: 1 }}
        fill="none"
        d={edgePath}
      />
      {/* Label */}
      {label && (
        <text
          x={midX}
          y={midY}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ fontSize: '12px', fill: 'black' }}
        >
          {label}
        </text>
      )}
    </g>
  );
};

export default CustomConnectionLine;
