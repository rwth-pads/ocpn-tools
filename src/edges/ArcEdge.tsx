import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useInternalNode, EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
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
    labelOffset?: { x: number; y: number }; // Custom offset for the label position
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

  // Get edges from store to detect parallel arcs
  const edges = useStore((state) => {
    const activePetriNetId = state.activePetriNetId;
    const petriNet = activePetriNetId ? state.petriNetsById[activePetriNetId] : null;
    return petriNet?.edges ?? [];
  });

  // Compute parallel arc info using useMemo to avoid recalculating on every render
  const { parallelArcIndex, totalParallelArcs } = useMemo(() => {
    // Find all parallel arcs (same source-target pair, in either direction)
    const parallelArcs = edges.filter(edge => 
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
    );
    
    const totalArcs = parallelArcs.length;
    let arcIndex = parallelArcs.findIndex(edge => edge.id === id);
    if (arcIndex === -1) arcIndex = 0;
    
    return { parallelArcIndex: arcIndex, totalParallelArcs: totalArcs };
  }, [edges, id, source, target]);

  // Determine arc color based on the connected place's colorset
  // For arcs, one end is always a place and the other is a transition
  const colorSetColor = useStore((state) => {
    const activePetriNetId = state.activePetriNetId;
    const petriNet = activePetriNetId ? state.petriNetsById[activePetriNetId] : null;
    
    if (!petriNet) return '#000';
    
    // Find the place node (source or target - one of them should be a place)
    const sourceNodeData = petriNet.nodes.find(n => n.id === source);
    const targetNodeData = petriNet.nodes.find(n => n.id === target);
    
    // Determine which node is the place (places have colorSet in their data)
    const placeNode = sourceNodeData?.type === 'place' ? sourceNodeData : 
                      targetNodeData?.type === 'place' ? targetNodeData : null;
    
    if (placeNode && placeNode.data?.colorSet) {
      const placeColorSet = state.colorSets.find(cs => cs.name === placeNode.data.colorSet);
      if (placeColorSet?.color) {
        return placeColorSet.color;
      }
    }
    
    // Fallback: try to match a single variable in the inscription
    if (typeof label === 'string') {
      const variable = state.variables.find((v) => v.name === label.trim());
      if (variable) {
        const varColorSet = state.colorSets.find((cs) => cs.name === variable.colorSet);
        if (varColorSet?.color) {
          return varColorSet.color;
        }
      }
    }
    
    return '#000';
  });
  
  // Get the updateEdgeData function from the store
  const updateEdgeData = useStore((state) => state.updateEdgeData);
  const activePetriNetId = useStore((state) => state.activePetriNetId);

  // Handler for when label is dragged - must be before early return
  const handleLabelDragEnd = useCallback((newOffset: { x: number; y: number }) => {
    if (activePetriNetId) {
      updateEdgeData(activePetriNetId, id, {
        ...data,
        labelOffset: newOffset,
      });
    }
  }, [activePetriNetId, id, data, updateEdgeData]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const bendpoints = data?.bendpoints;
  const labelOffset = data?.labelOffset ?? { x: 0, y: 0 };
  const isBidirectional = data?.isBidirectional ?? false;
  
  // Calculate offset for parallel arcs
  // Center the group of arcs: offset from -(n-1)/2 to +(n-1)/2
  const offsetSpacing = 12; // pixels between parallel arcs
  let offsetAmount = 0;
  
  if (totalParallelArcs > 1) {
    // For 2 arcs: indices 0,1 → offsets -6, +6
    // For 3 arcs: indices 0,1,2 → offsets -12, 0, +12
    const centerOffset = (totalParallelArcs - 1) / 2;
    offsetAmount = (parallelArcIndex - centerOffset) * offsetSpacing;
  }
  
  // First, get the base edge params (center-to-center direction)
  const edgeParams = getEdgeParams(sourceNode, targetNode);
  
  // Calculate perpendicular direction for offsetting
  // IMPORTANT: Use a canonical ordering (smaller ID to larger ID) so that
  // parallel arcs in opposite directions use the SAME perpendicular vector
  const canonicalSource = source < target ? source : target;
  const isCanonicalDirection = source === canonicalSource;
  
  const baseDx = edgeParams.tx - edgeParams.sx;
  const baseDy = edgeParams.ty - edgeParams.sy;
  const baseLen = Math.sqrt(baseDx * baseDx + baseDy * baseDy);
  
  // Perpendicular unit vector (always computed in canonical direction)
  let perpX = baseLen > 0 ? -baseDy / baseLen : 0;
  let perpY = baseLen > 0 ? baseDx / baseLen : 1;
  
  // If this arc goes against canonical direction, flip the perpendicular
  // so all parallel arcs use the same world-space perpendicular
  if (!isCanonicalDirection) {
    perpX = -perpX;
    perpY = -perpY;
  }
  
  let sx: number, sy: number, tx: number, ty: number;
  let edgePath: string;
  let labelX: number, labelY: number;
  
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
    const pathResult = buildPathWithBendpoints(sx, sy, tx, ty, offsetBendpoints);
    edgePath = pathResult.path;
    labelX = pathResult.labelX;
    labelY = pathResult.labelY;
  } else {
    // No bendpoints - apply offset to start/end points
    sx = edgeParams.sx + perpX * offsetAmount;
    sy = edgeParams.sy + perpY * offsetAmount;
    tx = edgeParams.tx + perpX * offsetAmount;
    ty = edgeParams.ty + perpY * offsetAmount;
    
    const pathResult = buildPathWithBendpoints(sx, sy, tx, ty, undefined);
    edgePath = pathResult.path;
    labelX = pathResult.labelX;
    labelY = pathResult.labelY;
  }
  
  // Calculate perpendicular offset for default label positioning (above the arc)
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const labelOffsetDistance = 12;
  
  let labelPerpX = len > 0 ? -dy / len : 0;
  let labelPerpY = len > 0 ? dx / len : -1;
  
  if (labelPerpY > 0) {
    labelPerpX = -labelPerpX;
    labelPerpY = -labelPerpY;
  }
  
  const baseLabelX = labelX + labelPerpX * labelOffsetDistance;
  const baseLabelY = labelY + labelPerpY * labelOffsetDistance;
  
  const formattedLabel = typeof label === 'string' ? label : label;
  
  return (
    <>
      {renderArcPath(id, edgePath, colorSetColor, isBidirectional, style)}
      {formattedLabel && (
        <DraggableArcLabel
          id={id}
          label={formattedLabel}
          baseLabelX={baseLabelX}
          baseLabelY={baseLabelY}
          labelOffset={labelOffset}
          onLabelDragEnd={handleLabelDragEnd}
        />
      )}
    </>
  );
}

// Helper function to render the arc SVG (markers and path only, label handled in main component)
function renderArcPath(
  id: string,
  edgePath: string,
  colorSetColor: string,
  isBidirectional: boolean,
  style?: React.CSSProperties,
) {
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
    </g>
  );
}

// Draggable label component for arc inscriptions
function DraggableArcLabel({
  id,
  label,
  baseLabelX,
  baseLabelY,
  labelOffset,
  onLabelDragEnd,
}: {
  id: string;
  label: React.ReactNode;
  baseLabelX: number;
  baseLabelY: number;
  labelOffset: { x: number; y: number };
  onLabelDragEnd: (offset: { x: number; y: number }) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(labelOffset);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const currentOffsetRef = useRef(dragOffset);
  
  // Keep ref in sync with state
  currentOffsetRef.current = dragOffset;
  
  // Get viewport zoom for proper drag scaling
  const { getZoom } = useReactFlow();
  
  // Access the store to select this edge when clicked
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const setSelectedElement = useStore((state) => state.setSelectedElement);
  const edges = useStore((state) => {
    const petriNet = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return petriNet?.edges || [];
  });
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: currentOffsetRef.current.x,
      offsetY: currentOffsetRef.current.y,
    };
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStartRef.current) return;
      const zoom = getZoom();
      // Divide by zoom to convert screen pixels to canvas pixels
      const dx = (moveEvent.clientX - dragStartRef.current.x) / zoom;
      const dy = (moveEvent.clientY - dragStartRef.current.y) / zoom;
      const newOffset = {
        x: dragStartRef.current.offsetX + dx,
        y: dragStartRef.current.offsetY + dy,
      };
      setDragOffset(newOffset);
      currentOffsetRef.current = newOffset;
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragStartRef.current) {
        onLabelDragEnd(currentOffsetRef.current);
      }
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onLabelDragEnd, getZoom]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Select the parent edge
    const edge = edges.find(edge => edge.id === id);
    if (edge && activePetriNetId) {
      setSelectedElement(activePetriNetId, { type: 'edge', element: edge });
    }
  }, [id, edges, activePetriNetId, setSelectedElement]);

  // Update dragOffset when labelOffset prop changes (e.g., after save)
  React.useEffect(() => {
    setDragOffset(labelOffset);
  }, [labelOffset]);

  const finalX = baseLabelX + dragOffset.x;
  const finalY = baseLabelY + dragOffset.y;

  return (
    <EdgeLabelRenderer>
      <div
        style={{
          transform: `translate(-50%, -100%) translate(${finalX}px,${finalY}px)`,
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
        }}
        className={`nodrag nopan edge-label-renderer__custom-edge text-[10px] font-mono whitespace-pre-wrap ${isDragging ? '' : 'hover:bg-accent/50'} px-1 rounded`}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      >
        {label}
      </div>
    </EdgeLabelRenderer>
  );
}

export default ArcEdge;
