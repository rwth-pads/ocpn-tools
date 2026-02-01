import React, { memo, useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useConnection, useReactFlow } from '@xyflow/react';
import useStore from '@/stores/store';

// Export the interface so it can be imported elsewhere
export interface TransitionNodeData {
  label: string;
  isArcMode: boolean;
  type: string;
  guard: string;
  time: string;
  priority: string;
  codeSegment: string;
  // Offset positions for draggable inscriptions
  guardOffset?: { x: number; y: number };
  timeOffset?: { x: number; y: number };
}

export interface TransitionNodeProps {
  id: string;
  data: TransitionNodeData;
  selected: boolean;
}

// Draggable inscription component with dynamic alignment
// Positions are relative to the center of the node
// Text alignment adjusts based on position: left of center = right-aligned, right of center = left-aligned
// When crossing the threshold, the offset is adjusted to compensate for text width so position doesn't jump
function DraggableInscription({
  children,
  offset,
  onDragEnd,
  className,
  style,
}: {
  children: React.ReactNode;
  offset: { x: number; y: number };
  onDragEnd: (offset: { x: number; y: number }) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  // Thresholds for alignment zones with hysteresis
  // To LEAVE current zone, you need to cross a larger threshold than to ENTER
  const enterThreshold = 25;  // Threshold to enter left/right zone from center
  const exitThreshold = 15;   // Threshold to exit left/right zone back to center

  // Get initial alignment (without hysteresis, since there's no previous state)
  const getInitialAlignment = (x: number): 'left' | 'right' | 'center' => {
    if (x < -enterThreshold) return 'right';
    if (x > enterThreshold) return 'left';
    return 'center';
  };

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(offset);
  const [alignment, setAlignment] = useState<'left' | 'right' | 'center'>(() => getInitialAlignment(offset.x));
  const currentOffsetRef = useRef(dragOffset);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);
  const prevAlignmentRef = useRef<'left' | 'right' | 'center'>(alignment);
  const { getZoom } = useReactFlow();

  // Determine alignment based on x offset with hysteresis
  const getAlignmentWithHysteresis = (
    x: number, 
    prevAlignment: 'left' | 'right' | 'center'
  ): 'left' | 'right' | 'center' => {
    if (prevAlignment === 'center') {
      // Currently center - need to cross enterThreshold to change
      if (x < -enterThreshold) return 'right';
      if (x > enterThreshold) return 'left';
      return 'center';
    } else if (prevAlignment === 'right') {
      // Currently right-aligned (left side) - need to cross exitThreshold toward center
      if (x > -exitThreshold) return 'center';
      return 'right';
    } else {
      // Currently left-aligned (right side) - need to cross exitThreshold toward center
      if (x < exitThreshold) return 'center';
      return 'left';
    }
  };

  // Keep ref in sync
  currentOffsetRef.current = dragOffset;
  prevAlignmentRef.current = alignment;

  React.useEffect(() => {
    setDragOffset(offset);
    const newAlignment = getInitialAlignment(offset.x);
    setAlignment(newAlignment);
  }, [offset]);

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
      const dx = (moveEvent.clientX - dragStartRef.current.x) / zoom;
      const dy = (moveEvent.clientY - dragStartRef.current.y) / zoom;
      let newX = dragStartRef.current.offsetX + dx;
      const newY = dragStartRef.current.offsetY + dy;

      // Check if alignment is changing and compensate for text width
      const prevAlignment = prevAlignmentRef.current;
      const newAlignment = getAlignmentWithHysteresis(newX, prevAlignment);
      
      if (elementRef.current && newAlignment !== prevAlignment) {
        const textWidth = elementRef.current.offsetWidth;
        
        // Compensate x offset when crossing alignment boundaries
        // When alignment changes, the CSS translateX changes:
        // - 'right' (left side): translateX(-100%) - anchored from right edge
        // - 'center': translateX(-50%) - anchored from center
        // - 'left' (right side): translateX(0%) - anchored from left edge
        // We need to adjust offset to keep visual position stable
        
        if (prevAlignment === 'right' && newAlignment === 'left') {
          // translateX goes from -100% to 0%, element shifts right by textWidth
          // Compensate by reducing offset
          dragStartRef.current.offsetX -= textWidth;
          newX -= textWidth;
        } else if (prevAlignment === 'left' && newAlignment === 'right') {
          // translateX goes from 0% to -100%, element shifts left by textWidth
          // Compensate by increasing offset
          dragStartRef.current.offsetX += textWidth;
          newX += textWidth;
        } else if (prevAlignment === 'center' && newAlignment === 'left') {
          // translateX goes from -50% to 0%, element shifts right by textWidth/2
          dragStartRef.current.offsetX -= textWidth / 2;
          newX -= textWidth / 2;
        } else if (prevAlignment === 'center' && newAlignment === 'right') {
          // translateX goes from -50% to -100%, element shifts left by textWidth/2
          dragStartRef.current.offsetX += textWidth / 2;
          newX += textWidth / 2;
        } else if (prevAlignment === 'left' && newAlignment === 'center') {
          // translateX goes from 0% to -50%, element shifts left by textWidth/2
          dragStartRef.current.offsetX += textWidth / 2;
          newX += textWidth / 2;
        } else if (prevAlignment === 'right' && newAlignment === 'center') {
          // translateX goes from -100% to -50%, element shifts right by textWidth/2
          dragStartRef.current.offsetX -= textWidth / 2;
          newX -= textWidth / 2;
        }
        
        prevAlignmentRef.current = newAlignment;
        setAlignment(newAlignment);
      }

      const newOffset = { x: newX, y: newY };
      setDragOffset(newOffset);
      currentOffsetRef.current = newOffset;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (dragStartRef.current) {
        onDragEnd(currentOffsetRef.current);
      }
      dragStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getZoom, onDragEnd]);

  // Calculate transform based on current alignment
  let translateXPercent = '-50%';
  if (alignment === 'right') {
    translateXPercent = '-100%';
  } else if (alignment === 'left') {
    translateXPercent = '0%';
  }

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        transform: `translate(calc(${translateXPercent} + ${dragOffset.x}px), ${dragOffset.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        textAlign: alignment,
        ...style,
      }}
      className={`nodrag ${className || ''}`}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}

export const TransitionNode: React.FC<TransitionNodeProps> = ({ id, data, selected }) => {
  const connection = useConnection();
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const isTarget = connection.inProgress && connection.fromNode.id !== id && connection.fromNode.type === 'place';

  // Default offsets for inscriptions (relative to node center)
  // Guard on top-left: negative x (left of center), negative y (above top edge)
  // Time on top-right: positive x (right of center), negative y (above top edge)
  const guardOffset = data.guardOffset ?? { x: -45, y: -15 };
  const timeOffset = data.timeOffset ?? { x: 45, y: -15 };

  const handleGuardDragEnd = useCallback((newOffset: { x: number; y: number }) => {
    if (activePetriNetId) {
      updateNodeData(activePetriNetId, id, { ...data, guardOffset: newOffset });
    }
  }, [activePetriNetId, id, data, updateNodeData]);

  const handleTimeDragEnd = useCallback((newOffset: { x: number; y: number }) => {
    if (activePetriNetId) {
      updateNodeData(activePetriNetId, id, { ...data, timeOffset: newOffset });
    }
  }, [activePetriNetId, id, data, updateNodeData]);

  return (
    <div className="relative cpn-node transition-node">

      <NodeResizer
        isVisible={selected}
        minWidth={15}
        minHeight={30}
      />
      
      {/* Static Label */}
      <div className="whitespace-pre-wrap leading-tight">
        {data.label}
      </div>

      {/* Guard inscription - displayed on top-left like CPN Tools */}
      {data.guard && (
        <DraggableInscription
          offset={guardOffset}
          onDragEnd={handleGuardDragEnd}
          className="text-[9px] font-mono whitespace-nowrap text-[#006400]"
        >
          {data.guard}
        </DraggableInscription>
      )}

      {/* Time inscription - displayed on top-right like CPN Tools */}
      {data.time && (
        <DraggableInscription
          offset={timeOffset}
          onDragEnd={handleTimeDragEnd}
          className="text-[9px] font-mono whitespace-nowrap text-[#8B4513]"
        >
          @+{data.time}
        </DraggableInscription>
      )}
      
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
        style={{ visibility: (data.isArcMode && isTarget) ? 'visible' : 'hidden' }}
        isConnectable={isTarget}
      />
    </div>
  );
};

export default memo(TransitionNode);
