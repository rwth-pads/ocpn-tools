import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Network, ArrowDown, ArrowRight } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface LayoutOptions {
  algorithm: "dagre" | "elk" | "oc-sugiyama"
  direction: "TB" | "LR"
  nodeSeparation: number
  rankSeparation: number
  /** OC-Sugiyama specific: how strongly same-type places cluster together (0–1) */
  objectAttraction: number
}

interface LayoutPopoverProps {
  onApplyLayout: (options: LayoutOptions) => void
}

export function LayoutPopover({ onApplyLayout }: LayoutPopoverProps) {
  const [options, setOptions] = useState<LayoutOptions>({
    algorithm: "dagre",
    direction: "TB",
    nodeSeparation: 50,
    rankSeparation: 100,
    objectAttraction: 0.5,
  })

  const [open, setOpen] = useState(false)

  const handleApplyLayout = () => {
    onApplyLayout(options)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Network className="h-5 w-5" />
                  <span className="sr-only">Layout</span>
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Layout Options</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Layout Options</h4>

          <div className="space-y-2">
            <Label htmlFor="algorithm">Algorithm</Label>
            <Select
              value={options.algorithm}
              onValueChange={(value: "dagre" | "elk" | "oc-sugiyama") => setOptions({ ...options, algorithm: value })}
            >
              <SelectTrigger id="algorithm">
                <SelectValue placeholder="Select algorithm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dagre">Dagre</SelectItem>
                <SelectItem value="elk">ELK</SelectItem>
                <SelectItem value="oc-sugiyama">OC-Sugiyama</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <ToggleGroup
              type="single"
              value={options.direction}
              onValueChange={(value: "TB" | "LR") => {
                if (value) setOptions({ ...options, direction: value })
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="TB" aria-label="Vertical Layout" title="Vertical Layout">
                <ArrowDown className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="LR" aria-label="Horizontal Layout" title="Horizontal Layout">
                <ArrowRight className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="nodeSeparation">Node Spacing</Label>
              <span className="text-xs text-muted-foreground">{options.nodeSeparation}px</span>
            </div>
            <Slider
              id="nodeSeparation"
              min={10}
              max={200}
              step={5}
              value={[options.nodeSeparation]}
              onValueChange={(value) => setOptions({ ...options, nodeSeparation: value[0] })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="rankSeparation">Layer Spacing</Label>
              <span className="text-xs text-muted-foreground">{options.rankSeparation}px</span>
            </div>
            <Slider
              id="rankSeparation"
              min={20}
              max={300}
              step={10}
              value={[options.rankSeparation]}
              onValueChange={(value) => setOptions({ ...options, rankSeparation: value[0] })}
            />
          </div>

          {options.algorithm === "oc-sugiyama" && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="objectAttraction">Object Attraction</Label>
                <span className="text-xs text-muted-foreground">{options.objectAttraction.toFixed(2)}</span>
              </div>
              <Slider
                id="objectAttraction"
                min={0}
                max={1}
                step={0.05}
                value={[options.objectAttraction]}
                onValueChange={(value) => setOptions({ ...options, objectAttraction: value[0] })}
              />
              <p className="text-xs text-muted-foreground">
                How strongly places of the same type cluster together
              </p>
            </div>
          )}

          <Button className="w-full" onClick={handleApplyLayout}>
            Apply Layout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
