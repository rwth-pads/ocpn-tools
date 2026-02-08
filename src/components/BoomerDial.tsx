import { useState, useRef, useEffect } from "react"

// Define types for the slice and props
export interface Slice {
  label: string[]
  angle: number
  key?: string | number // Optional identifier for the slice
  disabled?: boolean // Optional property to disable the slice
}

export interface BoomerDialProps {
  slices: Slice[]
  position: { x: number; y: number }
  isOpen: boolean
  onClose: () => void
  onSliceClick: (sliceIndex: number, slice: Slice) => void
  size?: number // Optional size in pixels
}

export function BoomerDial({
  slices,
  position,
  isOpen,
  onClose,
  onSliceClick,
  size = 240, // Default size
}: BoomerDialProps) {
  const [hoverSlice, setHoverSlice] = useState<number | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Close the popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && isOpen) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: "translate(-50%, -50%)",
      }}
      ref={popoverRef}
    >
      <div
        className="rounded-full bg-sky-100 overflow-visible shadow-lg"
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {slices.map((slice, index) => {
            // Calculate start and end angles for each slice (in radians)
            const startAngle = ((slice.angle - 30) * Math.PI) / 180
            const endAngle = ((slice.angle + 30) * Math.PI) / 180

            // Calculate the points for the slice path
            const x1 = 50 + 50 * Math.cos(startAngle)
            const y1 = 50 + 50 * Math.sin(startAngle)
            const x2 = 50 + 50 * Math.cos(endAngle)
            const y2 = 50 + 50 * Math.sin(endAngle)

            // Create the path for the slice
            const path = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`

            // Calculate text position
            const textDistance = 38 // Distance from center
            const textX = 50 + textDistance * Math.cos((slice.angle * Math.PI) / 180)
            const textY = 50 + textDistance * Math.sin((slice.angle * Math.PI) / 180)

            const isActive = index === hoverSlice

            return (
              <g
                key={index}
                onClick={() => !slice.disabled && onSliceClick(index, slice)}
                onMouseEnter={() => !slice.disabled && setHoverSlice(index)}
                onMouseLeave={() => setHoverSlice(null)}
                style={{ cursor: slice.disabled ? "default" : "pointer" }}
              >
                <path d={path} fill={isActive && !slice.disabled ? "#6b9ac4" : "transparent"} stroke="#e2e8f0" strokeWidth="0.5" />

                {/* Text labels */}
                <g transform={`translate(${textX}, ${textY}) rotate(${slice.angle})`}>
                  {slice.label.map((line, lineIndex) => (
                    <text
                      key={lineIndex}
                      x="0"
                      y={lineIndex * 8}
                      textAnchor="middle"
                      fontSize="5"
                      fill={slice.disabled ? "#d3d3d3" : "#333"}
                      transform={`rotate(-${slice.angle})`}
                      dominantBaseline="middle"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
