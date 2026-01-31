import React, { useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useConnection, useReactFlow } from '@xyflow/react';
import useStore from '@/stores/store'; // Import Zustand store

// Export the interface so it can be imported elsewhere
export interface PlaceNodeData {
  label: string;
  isArcMode: boolean;
  type: string;
  colorSet: string;
  initialMarking: string;
  marking: string;
  // Offset positions for draggable inscriptions
  colorSetOffset?: { x: number; y: number };
  tokenCountOffset?: { x: number; y: number };
  markingOffset?: { x: number; y: number };
}

export interface PlaceNodeProps {
  id: string;
  data: PlaceNodeData;
  selected: boolean;
}

// Draggable inscription component
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

  React.useEffect(() => {
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
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        ...style,
      }}
      className={`nodrag ${className || ''}`}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  );
}

// Format marking for display (CPN Tools style: 1`value ++ 1`value2)
function formatMarkingDisplay(marking: (string | number | (string | number)[])[]): string {
  return marking.map(token => {
    if (Array.isArray(token)) {
      return `1\`(${token.map(t => typeof t === 'string' ? `"${t}"` : t).join(',')})`;
    } else if (typeof token === 'string') {
      return `1\`"${token}"`;
    } else {
      return `1\`${token}`;
    }
  }).join('++\n');
}

export const PlaceNode: React.FC<PlaceNodeProps> = ({ id, data, selected }) => {
  const connection = useConnection();
  const colorSetColor = useStore((state) =>
    state.colorSets.find((colorSet) => colorSet.name === data.colorSet)?.color || '#000000'
  );
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const updateNodeData = useStore((state) => state.updateNodeData);

  const isTarget = connection.inProgress && connection.fromNode.id !== id && connection.fromNode.type === 'transition';

  const hasMarking = data.marking && Array.isArray(data.marking) && data.marking.length > 0;
  const tokenCount = hasMarking ? data.marking.length : 0;
  const markingDisplay = hasMarking ? formatMarkingDisplay(data.marking as (string | number | (string | number)[])[]) : '';

  // Default offsets for inscriptions
  const colorSetOffset = data.colorSetOffset ?? { x: 0, y: 35 }; // Below the place
  const tokenCountOffset = data.tokenCountOffset ?? { x: 25, y: -5 }; // Top-right of place
  const markingOffset = data.markingOffset ?? { x: 40, y: 0 }; // Right of token count

  const handleColorSetDragEnd = useCallback((newOffset: { x: number; y: number }) => {
    if (activePetriNetId) {
      updateNodeData(activePetriNetId, id, { ...data, colorSetOffset: newOffset });
    }
  }, [activePetriNetId, id, data, updateNodeData]);

  const handleTokenCountDragEnd = useCallback((newOffset: { x: number; y: number }) => {
    if (activePetriNetId) {
      updateNodeData(activePetriNetId, id, { ...data, tokenCountOffset: newOffset });
    }
  }, [activePetriNetId, id, data, updateNodeData]);

  const handleMarkingDragEnd = useCallback((newOffset: { x: number; y: number }) => {
    if (activePetriNetId) {
      updateNodeData(activePetriNetId, id, { ...data, markingOffset: newOffset });
    }
  }, [activePetriNetId, id, data, updateNodeData]);

  return (
    <div className="relative cpn-node place-node" style={{ borderColor: colorSetColor }}>
      <NodeResizer
        isVisible={selected}
        minWidth={30}
        minHeight={30}
      />

      {/* Static Label */}
      <div className="whitespace-pre-wrap leading-tight">
        {data.label}
      </div>

      {/* ColorSet inscription - draggable */}
      {data.colorSet && (
        <DraggableInscription
          offset={colorSetOffset}
          onDragEnd={handleColorSetDragEnd}
          className="text-[9px] font-mono whitespace-nowrap"
          style={{ top: '50%', left: '50%' }}
        >
          {data.colorSet}
        </DraggableInscription>
      )}

      {/* Token count circle - draggable */}
      {hasMarking && (
        <DraggableInscription
          offset={tokenCountOffset}
          onDragEnd={handleTokenCountDragEnd}
          style={{ top: '50%', left: '50%' }}
        >
          <div className="marking flex items-center justify-center text-[9px] text-black rounded-full min-w-[14px] h-[14px] px-0.5">
            {tokenCount}
          </div>
        </DraggableInscription>
      )}

      {/* Current marking rectangle - draggable */}
      {hasMarking && (
        <DraggableInscription
          offset={markingOffset}
          onDragEnd={handleMarkingDragEnd}
          style={{ top: '50%', left: '50%' }}
        >
          <div className="marking text-[9px] font-mono text-black px-1 py-0.5 rounded-sm whitespace-pre leading-tight">
            {markingDisplay}
          </div>
        </DraggableInscription>
      )}

      <Handle
        className="custom-handle"
        type="source"
        position={Position.Right}
        style={{ visibility: data.isArcMode && !connection.inProgress ? 'visible' : 'hidden' }}
      />
      <Handle
        className="custom-handle"
        type="target"
        position={Position.Left}
        style={{ visibility: data.isArcMode && isTarget ? 'visible' : 'hidden' }}
        isConnectable={isTarget}
      />
    </div>
  );
};
