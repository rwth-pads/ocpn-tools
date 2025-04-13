import React from 'react';
import { getStraightPath, useInternalNode, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams } from '../utils.js';
import useStore from '@/stores/store'; // Import Zustand store

interface FloatingEdgeProps {
  id: string;
  source: string;
  target: string;
  markerEnd?: string;
  style?: React.CSSProperties;
  label?: React.ReactNode; // Optional label for the edge
}

function ArcEdge({ id, source, target, markerEnd, style, label }: FloatingEdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const colorSetColor = useStore((state) => {
    const variable = state.variables.find((v) => v.name === label);
    return state.colorSets.find((cs) => cs.name === variable?.colorSet)?.color || '#000';
  });

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
      /* Edge Path */
        <path
          id={id}
          d={edgePath}
          className="stroke-[currentColor]"
          style={{ stroke: colorSetColor, ...style }}
          markerEnd={markerEnd}
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

export default ArcEdge;
