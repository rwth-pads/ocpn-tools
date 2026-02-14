import React, { useCallback, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useConnection, useReactFlow } from '@xyflow/react';
import useStore from '@/stores/store'; // Import Zustand store
import { isTimedToken } from '@/types';
import { formatDateTimeFull } from '@/utils/timeFormat';

// Export the interface so it can be imported elsewhere
export interface PlaceNodeData {
  label: string;
  isArcMode: boolean;
  type: string;
  colorSet: string;
  initialMarking: string;
  marking: unknown[]; // Array of tokens (can be plain values or TimedToken objects)
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

// Format a single token value for display (handles objects/records, arrays, strings, numbers)
function formatTokenValue(token: unknown, isUnitType: boolean = false): string {
  if (token === null || token === undefined) {
    return isUnitType ? '•' : '()';
  } else if (token instanceof Map) {
    // Convert Map to object notation
    const entries: string[] = [];
    token.forEach((value, key) => {
      entries.push(`${key}=${formatTokenValue(value)}`);
    });
    return `{${entries.join(', ')}}`; 
  } else if (Array.isArray(token)) {
    // Product/tuple type
    return `(${token.map(t => formatTokenValue(t)).join(',')})`; 
  } else if (typeof token === 'object') {
    // Check if it's a timed token - don't format the wrapper, just the value
    if (isTimedToken(token)) {
      return formatTokenValue(token.value, isUnitType);
    }
    // Plain object (record type)
    const entries = Object.entries(token).map(([k, v]) => `${k}=${formatTokenValue(v)}`);
    return `{${entries.join(', ')}}`; 
  } else if (typeof token === 'string') {
    return `"${token}"`;
  } else {
    return String(token);
  }
}

// Format time for display - relative or absolute based on epoch
function formatTimeDisplay(timestampMs: number, epoch: Date | null): string {
  if (epoch) {
    // Absolute time display
    const date = new Date(epoch.getTime() + timestampMs);
    return formatDateTimeFull(date);
  }
  // Relative time display
  if (timestampMs === 0) return '@0';
  const seconds = timestampMs / 1000;
  if (seconds < 60) return `@${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `@${minutes.toFixed(minutes % 1 === 0 ? 0 : 1)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `@${hours.toFixed(hours % 1 === 0 ? 0 : 1)}h`;
  const days = hours / 24;
  return `@${days.toFixed(days % 1 === 0 ? 0 : 1)}d`;
}

// Get grouped marking data for table display
export interface MarkingEntry {
  count: number;
  value: string;
  timestamp: number;
  timeDisplay: string;
}

function getMarkingTableData(marking: unknown[], isUnitType: boolean = false, isTimed: boolean = false, epoch: Date | null = null): MarkingEntry[] {
  if (isUnitType && !isTimed) {
    return [{ count: marking.length, value: '•', timestamp: 0, timeDisplay: '' }];
  }
  
  // Group tokens by value (and timestamp for timed tokens)
  const tokenCounts = new Map<string, MarkingEntry>();
  for (const token of marking) {
    const timestamp = isTimedToken(token) ? token.timestamp : 0;
    const value = isTimedToken(token) ? formatTokenValue(token.value, isUnitType) : formatTokenValue(token, isUnitType);
    const key = isTimed ? `${value}@${timestamp}` : value;
    const existing = tokenCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      tokenCounts.set(key, { 
        count: 1, 
        value, 
        timestamp,
        timeDisplay: isTimed ? formatTimeDisplay(timestamp, epoch) : ''
      });
    }
  }
  
  return Array.from(tokenCounts.values());
}

const MAX_VISIBLE_ROWS = 10;

export const PlaceNode: React.FC<PlaceNodeProps> = ({ id, data, selected }) => {
  const connection = useConnection();
  const colorSet = useStore((state) =>
    state.colorSets.find((cs) => cs.name === data.colorSet)
  );
  const colorSetColor = colorSet?.color || '#000000';
  // Check if this is a UNIT type colorset
  const isUnitType = colorSet?.type === 'basic' && colorSet?.definition?.includes('= unit;');
  // Check if this is a timed colorset
  const isTimed = colorSet?.timed === true;
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const updateNodeData = useStore((state) => state.updateNodeData);
  const showMarkingDisplay = useStore((state) => state.showMarkingDisplay);
  const simulationEpoch = useStore((state) => state.simulationEpoch);
  const epoch = simulationEpoch ? new Date(simulationEpoch) : null;

  const isTarget = connection.inProgress && connection.fromNode.id !== id && connection.fromNode.type === 'transition';

  const hasMarking = data.marking && Array.isArray(data.marking) && data.marking.length > 0;
  const tokenCount = hasMarking ? data.marking.length : 0;
  const markingTableData = hasMarking ? getMarkingTableData(data.marking as unknown[], isUnitType, isTimed, epoch) : [];
  const visibleRows = markingTableData.slice(0, MAX_VISIBLE_ROWS);
  const hasMoreRows = markingTableData.length > MAX_VISIBLE_ROWS;

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

      {/* Current marking table - draggable */}
      {hasMarking && showMarkingDisplay && (
        <DraggableInscription
          offset={markingOffset}
          onDragEnd={handleMarkingDragEnd}
          style={{ top: '50%', left: '50%' }}
        >
          <table className="marking text-[7px] font-mono text-black rounded-sm border-collapse">
            <tbody>
              {visibleRows.map((entry, idx) => (
                <tr key={idx}>
                  <td className="px-1 py-0.5 text-right">{entry.count}`</td>
                  <td className="px-1 py-0.5">{entry.value}</td>
                  {isTimed && <td className="px-1 py-0.5 text-muted-foreground whitespace-nowrap">{entry.timeDisplay}</td>}
                </tr>
              ))}
              {hasMoreRows && (
                <tr>
                  <td colSpan={isTimed ? 3 : 2} className="px-1 py-0.5 text-center text-muted-foreground">
                    ...{markingTableData.length - MAX_VISIBLE_ROWS} more
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
