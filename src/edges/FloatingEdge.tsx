import React from 'react';
import { getStraightPath, useInternalNode, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../utils.js';

interface FloatingEdgeProps {
  id: string;
  source: string;
  target: string;
  markerEnd?: string;
  style?: React.CSSProperties;
  label?: React.ReactNode; // Optional label for the edge
}

function FloatingEdge({ id, source, target, markerEnd, style, label }: FloatingEdgeProps): JSX.Element | null {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  return (
    <g>
      {/* Edge Path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
        style={style}
      />
      {/* Label using EdgeLabelRenderer */}
      {label && (
        <EdgeLabelRenderer>
          <div style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
            className="edge-label-renderer__custom-edge nodrag nopan">
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}

export default FloatingEdge;
