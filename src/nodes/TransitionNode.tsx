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

// Draggable inscription component
// Positions are relative to the center of the node
// Always anchors from the center of the text (no alignment switching)
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(offset);
  const currentOffsetRef = useRef(dragOffset);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const { getZoom } = useReactFlow();

  // Keep ref in sync
  currentOffsetRef.current = dragOffset;

  // Track previous offset to detect actual changes
  const prevOffsetRef = useRef(offset);

  React.useEffect(() => {
    // Only reset if offset actually changed (not just re-render)
    if (prevOffsetRef.current.x === offset.x && prevOffsetRef.current.y === offset.y) {
      return;
    }
    prevOffsetRef.current = offset;
    setDragOffset(offset);
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
      const newX = dragStartRef.current.offsetX + dx;
      const newY = dragStartRef.current.offsetY + dy;

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

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        transform: `translate(calc(-50% + ${dragOffset.x}px), ${dragOffset.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        whiteSpace: 'nowrap',
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
  // Time on top-right: positive x (right of center), negative y (above top edge)
  const timeOffset = data.timeOffset ?? { x: 45, y: -15 };

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

      {/* Guard inscription removed - shown only as badge icon */}

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

      {/* Guard badge - shield icon at top-left corner */}
      {data.guard && data.guard.trim() && (
        <div
          style={{
            position: 'absolute',
            top: -2,
            left: -2,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none"
          title={`Guard: ${data.guard}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="11.5" fill="white" stroke="#006400" strokeWidth="1" />
            <path d="M12 4L6 7v4c0 3.5 2.5 6.7 6 8 3.5-1.3 6-4.5 6-8V7l-6-3z" fill="#006400" fillOpacity="0.15" stroke="#006400" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Code segment badge - small icon at bottom-right corner */}
      {data.codeSegment && data.codeSegment.trim() && (
        <div
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            transform: 'translate(50%, 50%)',
          }}
          className="pointer-events-none"
          title="Has code segment"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="7" r="6.5" fill="white" stroke="#6b7280" strokeWidth="1" />
            <text x="7" y="10" textAnchor="middle" fontSize="8" fontFamily="monospace" fontWeight="600" fill="#6b7280">{'{}'}</text>
          </svg>
        </div>
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
