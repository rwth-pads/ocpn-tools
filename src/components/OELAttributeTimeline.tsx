import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Attribute, ValueChange } from '@/components/ObjectEvolutionPanel';

interface AttributeTimelineProps {
  attribute: Attribute
  timeRange: [number, number]
  valueChanges: ValueChange[]
  onAddChange: (timestamp: number) => void
  onEditChange: (change: ValueChange) => void
}

export function AttributeTimeline({
  attribute,
  timeRange,
  valueChanges,
  onAddChange,
  onEditChange,
}: AttributeTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  // Update width on resize
  useEffect(() => {
    // Copy ref.current to a variable inside the effect
    const currentTimelineRef = timelineRef.current;
    if (!currentTimelineRef) return;

    const updateWidth = () => {
      // Use the variable inside the resize handler
      setWidth(currentTimelineRef.offsetWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    // Observe using the variable
    observer.observe(currentTimelineRef);

    return () => {
      // Use the variable in the cleanup function
      if (currentTimelineRef) {
        observer.unobserve(currentTimelineRef);
      }
    };
    // No dependencies needed here as we capture the ref value
  }, []);

  // Calculate position on timeline
  const getPositionFromTimestamp = (timestamp: number) => {
    const [start, end] = timeRange
    const range = end - start
    const position = ((timestamp - start) / range) * width
    return Math.max(0, Math.min(width, position))
  }

  // Calculate timestamp from position
  const getTimestampFromPosition = (position: number) => {
    const [start, end] = timeRange
    const range = end - start
    const timestamp = start + (position / width) * range
    return Math.max(start, Math.min(end, timestamp))
  }

  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const position = e.clientX - rect.left
    const timestamp = getTimestampFromPosition(position)

    onAddChange(Math.round(timestamp))
  }

  // Format operation for display
  const formatOperation = (operation: string, value: string | number | boolean) => {
    switch (operation) {
      case "set":
        return `= ${value}`
      case "add":
        return `+ ${value}`
      case "subtract":
        return `- ${value}`
      case "prefix":
        return `prefix "${value}"`
      case "append":
        return `append "${value}"`
      case "increasePercent":
        return `+${value}%`
      case "decreasePercent":
        return `-${value}%`
      case "reset":
        return "reset"
      default:
        return operation
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-medium">
          {attribute.name}
          <span className="ml-2 text-xs text-muted-foreground">
            ({attribute.type}, initial: {attribute.initialValue.toString()})
          </span>
        </Label>
      </div>

      <div ref={timelineRef} className="h-8 bg-muted rounded-md relative cursor-pointer" onClick={handleTimelineClick}>
        {/* Timeline ticks */}
        <div className="absolute inset-0 flex items-center">
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <div
              key={fraction}
              className="absolute h-2 border-l border-muted-foreground/30"
              style={{ left: `${fraction * 100}%` }}
            />
          ))}
        </div>

        {/* Time labels */}
        <div className="absolute inset-x-0 -bottom-5 flex justify-between text-xs text-muted-foreground">
          <span>{timeRange[0]}</span>
          <span>{Math.round((timeRange[0] + timeRange[1]) / 2)}</span>
          <span>{timeRange[1]}</span>
        </div>

        {/* Value change markers */}
        <TooltipProvider>
          {valueChanges.map((change) => (
            <Tooltip key={change.id}>
              <TooltipTrigger asChild>
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full cursor-pointer z-10"
                  style={{ left: `${getPositionFromTimestamp(change.timestamp)}px` }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditChange(change)
                  }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Time: {change.timestamp}</p>
                <p>{formatOperation(change.operation, change.value)}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  )
}
