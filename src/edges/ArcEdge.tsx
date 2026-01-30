import React from 'react';
import { useInternalNode, EdgeLabelRenderer } from '@xyflow/react';
import { getEdgeParams, getNodeIntersectionToPoint } from '../utils.js';
import useStore from '@/stores/store'; // Import Zustand store

interface FloatingEdgeProps {
  id: string;
  source: string;
  target: string;
  style?: React.CSSProperties;
  label?: React.ReactNode; // Optional label for the edge
  data?: {
    bendpoints?: { x: number; y: number }[];
    isBidirectional?: boolean;
    order?: number; // Order index for offsetting parallel arcs
  };
}

/**
 * Build an SVG path string that goes through bendpoints
 * Returns the path and the midpoint for label positioning
 */
function buildPathWithBendpoints(
  sx: number, sy: number, 
  tx: number, ty: number, 
  bendpoints?: { x: number; y: number }[]
): { path: string; labelX: number; labelY: number } {
  if (!bendpoints || bendpoints.length === 0) {
    // No bendpoints - straight line
    const path = `M ${sx},${sy} L ${tx},${ty}`;
    return { 
      path, 
      labelX: (sx + tx) / 2, 
      labelY: (sy + ty) / 2 
    };
  }

  // Build path through all bendpoints
  let path = `M ${sx},${sy}`;
  
  // Add line segments to each bendpoint
  for (const bp of bendpoints) {
    path += ` L ${bp.x},${bp.y}`;
  }
  
  // Final segment to target
  path += ` L ${tx},${ty}`;

  // Calculate label position at the middle of the path
  // For simplicity, place it at the first bendpoint or midpoint of first segment
  let labelX: number, labelY: number;
  
  if (bendpoints.length === 1) {
    // Single bendpoint - place label near the bendpoint
    labelX = bendpoints[0].x;
    labelY = bendpoints[0].y;
  } else {
    // Multiple bendpoints - place label at the middle bendpoint
    const midIndex = Math.floor(bendpoints.length / 2);
    labelX = bendpoints[midIndex].x;
    labelY = bendpoints[midIndex].y;
  }

  return { path, labelX, labelY };
}

function ArcEdge({ id, source, target, style, label, data }: FloatingEdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  const colorSetColor = useStore((state) => {
    const variable = state.variables.find((v) => v.name === label);
    return state.colorSets.find((cs) => cs.name === variable?.colorSet)?.color || '#000';
  });

  if (!sourceNode || !targetNode) {
    return null;
  }

  const bendpoints = data?.bendpoints;
  const order = data?.order ?? 0;
  
  // Calculate offset for parallel arcs based on order attribute
  // CPN Tools uses order 0, 1, 2, etc. for parallel arcs between same node pairs
  // We offset each arc perpendicular to the line: order 0 stays centered,
  // higher orders alternate sides with increasing distance
  // Pattern: 0 → 0px, 1 → +12px, 2 → -12px, 3 → +24px, 4 → -24px, etc.
  const offsetSpacing = 12; // pixels between parallel arcs
  let offsetAmount = 0;
  if (order > 0) {
    const offsetIndex = Math.ceil(order / 2);
    const side = order % 2 === 1 ? 1 : -1;
    offsetAmount = offsetIndex * offsetSpacing * side;
  }
  
  // First, get the base edge params (center-to-center direction)
  const edgeParams = getEdgeParams(sourceNode, targetNode);
  
  // Calculate perpendicular direction for offsetting
  const baseDx = edgeParams.tx - edgeParams.sx;
  const baseDy = edgeParams.ty - edgeParams.sy;
  const baseLen = Math.sqrt(baseDx * baseDx + baseDy * baseDy);
  
  // Perpendicular unit vector
  const perpX = baseLen > 0 ? -baseDy / baseLen : 0;
  const perpY = baseLen > 0 ? baseDx / baseLen : 1;
  
  let sx: number, sy: number, tx: number, ty: number;
  
  if (bendpoints && bendpoints.length > 0) {
    // Apply offset to bendpoints first
    const offsetBendpoints = offsetAmount !== 0 
      ? bendpoints.map(bp => ({
          x: bp.x + perpX * offsetAmount,
          y: bp.y + perpY * offsetAmount,
        }))
      : bendpoints;
    
    const firstBendpoint = offsetBendpoints[0];
    const lastBendpoint = offsetBendpoints[offsetBendpoints.length - 1];
    
    // Source intersection towards first (offset) bendpoint
    const sourceIntersection = getNodeIntersectionToPoint(sourceNode, firstBendpoint);
    sx = sourceIntersection.x;
    sy = sourceIntersection.y;
    
    // Target intersection from last (offset) bendpoint
    const targetIntersection = getNodeIntersectionToPoint(targetNode, lastBendpoint);
    tx = targetIntersection.x;
    ty = targetIntersection.y;
    
    // Build path with offset bendpoints
    const { path: edgePath, labelX, labelY } = buildPathWithBendpoints(sx, sy, tx, ty, offsetBendpoints);
    
    return renderArc(id, edgePath, sx, sy, tx, ty, labelX, labelY, label, data, colorSetColor, style);
  } else {
    // No bendpoints - apply offset to start/end points
    sx = edgeParams.sx + perpX * offsetAmount;
    sy = edgeParams.sy + perpY * offsetAmount;
    tx = edgeParams.tx + perpX * offsetAmount;
    ty = edgeParams.ty + perpY * offsetAmount;
    
    const { path: edgePath, labelX, labelY } = buildPathWithBendpoints(sx, sy, tx, ty, undefined);
    
    return renderArc(id, edgePath, sx, sy, tx, ty, labelX, labelY, label, data, colorSetColor, style);
  }
}

// Helper function to render the arc SVG
function renderArc(
  id: string,
  edgePath: string,
  sx: number, sy: number,
  tx: number, ty: number,
  labelX: number,
  labelY: number,
  label: React.ReactNode,
  data: FloatingEdgeProps['data'],
  colorSetColor: string,
  style?: React.CSSProperties,
) {
  // Format multiline labels - preserve newlines from CPN Tools
  const formattedLabel = typeof label === 'string' ? label : label;
  
  // For bidirectional arcs, add arrow marker at start as well
  const isBidirectional = data?.isBidirectional;
  
  // Calculate perpendicular offset for label positioning (above the arc)
  // In screen coordinates, "above" means smaller Y values (negative direction)
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const labelOffsetDistance = 12; // pixels offset from arc
  
  // Perpendicular vector (rotated 90 degrees counter-clockwise)
  let labelPerpX = len > 0 ? -dy / len : 0;
  let labelPerpY = len > 0 ? dx / len : -1;
  
  // Ensure label goes "above" the arc (negative Y in screen coords when possible)
  // If perpendicular points down (positive Y), flip it
  if (labelPerpY > 0) {
    labelPerpX = -labelPerpX;
    labelPerpY = -labelPerpY;
  }
  
  labelPerpX *= labelOffsetDistance;
  labelPerpY *= labelOffsetDistance;

  return (
    <g>
      {/* Define custom arrow markers */}
      <defs>
        {/* Arrow pointing forward (at end of arc) */}
        <marker
          id={`arrow-end-${id}`}
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points="0,0 10,5 0,10"
            fill={colorSetColor}
          />
        </marker>
        {/* Arrow pointing backward (at start of arc, for bidirectional) */}
        <marker
          id={`arrow-start-${id}`}
          markerWidth="10"
          markerHeight="10"
          refX="0"
          refY="5"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <polygon
            points="10,0 0,5 10,10"
            fill={colorSetColor}
          />
        </marker>
      </defs>
      {/* Edge Path */}
        <path
          id={id}
          d={edgePath}
          fill="none"
          className="stroke-[currentColor]"
          style={{ stroke: colorSetColor, ...style }}
          markerEnd={`url(#arrow-end-${id})`}
          markerStart={isBidirectional ? `url(#arrow-start-${id})` : undefined}
        />
        {/* Label using EdgeLabelRenderer - positioned above the arc */}
      {formattedLabel && (
        <EdgeLabelRenderer>
          <div style={{
            transform: `translate(-50%, -100%) translate(${labelX + labelPerpX}px,${labelY + labelPerpY}px)`,
          }}
            className="edge-label-renderer__custom-edge nodrag nopan text-[10px] font-mono whitespace-pre-wrap pointer-events-none">
            {formattedLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  );
}

export default ArcEdge;
