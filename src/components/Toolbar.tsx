import { Button } from "@/components/ui/button"
import { Circle, Square, ArrowRight } from "lucide-react"

import { Toggle } from '@/components/ui/toggle';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { Separator } from '@/components/ui/separator';

import { LayoutPopover, LayoutOptions } from "@/components/LayoutPopover";

import { useDnD } from '@/utils/DnDContext';

interface ToolbarProps {
  toggleArcMode: (pressed: boolean) => void;
  onApplyLayout: (options: LayoutOptions) => void;
}

export function Toolbar({ toggleArcMode, onApplyLayout }: ToolbarProps) {
  const [, setType] = useDnD();

  const onDragStart = (event: React.DragEvent<HTMLElement>, nodeType: string) => {
      //event.dataTransfer.setData("application/reactflow", nodeType);
      if (setType) {
        setType(nodeType);
      }
      event.dataTransfer.effectAllowed = "move";
    }

  return (
    <>
      <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-sm">
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Place"
                    className="cursor-grab"
                  >
                    <div
                      draggable
                      onDragStart={(event) => onDragStart(event, "place")}
                    >
                      <Circle className="h-5 w-5" />
                      <span className="sr-only">Drag a Place from Here</span>
                    </div>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag a Place from Here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Transition"
                    className="cursor-grab"
                  >
                    <div
                      draggable
                      onDragStart={(event) => onDragStart(event, "transition")}
                    >
                      <Square className="h-5 w-5" />
                      <span className="sr-only">Drag a Transition from Here</span>
                    </div>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag a Transition from Here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    aria-label="Toggle Arc"
                    onPressedChange={toggleArcMode}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Toggle Arc Mode</span>
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Arc Mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 h-6">
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>

        <div className="flex items-center gap-1">
        <LayoutPopover onApplyLayout={onApplyLayout} />
        {/* <Popover>
          <PopoverTrigger>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="icon" title="Layout Petri Net" onClick={layoutGraph}>
                      <Network className="h-5 w-5" />
                      <span className="sr-only">Layout Petri Net</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Layout Petri Net</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </PopoverTrigger>
          <PopoverContent>Place content for the popover here.</PopoverContent>
        </Popover> */}
        </div>

      </div>
    </>
  )
}

