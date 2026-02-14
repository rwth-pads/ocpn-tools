import { Button } from "@/components/ui/button"
import { Circle, Square, LetterText, ArrowRight, SquareStack } from "lucide-react"

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
import useStore from '@/stores/store';
import type { ArcType } from '@/types';

interface ToolbarProps {
  toggleArcMode: (pressed: boolean, arcType?: ArcType) => void;
  onApplyLayout: (options: LayoutOptions) => void;
}

export function Toolbar({ toggleArcMode, onApplyLayout }: ToolbarProps) {
  const [, setType] = useDnD();
  const showMarkingDisplay = useStore((state) => state.showMarkingDisplay);
  const setShowMarkingDisplay = useStore((state) => state.setShowMarkingDisplay);
  const activeArcType = useStore((state) => state.activeArcType);
  const isArcMode = useStore((state) => state.isArcMode);

  const handleArcToggle = (arcType: ArcType) => {
    if (isArcMode && activeArcType === arcType) {
      // Same type already active → turn off
      toggleArcMode(false);
    } else {
      // Activate this arc type
      toggleArcMode(true, arcType);
    }
  };

  const ArcTypeIcon = ({ type, className }: { type: ArcType; className?: string }) => {
    if (type === 'inhibitor') {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="12" x2="16" y2="12" />
          <circle cx="19" cy="12" r="3" fill="none" />
        </svg>
      );
    }
    if (type === 'reset') {
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
          <polygon points="12,6 20,12 12,18" />
          <polygon points="6,6 14,12 6,18" />
        </svg>
      );
    }
    return <ArrowRight className={className} />;
  };

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
                    aria-label="Toggle Arc Mode"
                    pressed={isArcMode && activeArcType === 'normal'}
                    onPressedChange={() => handleArcToggle('normal')}
                  >
                    <ArrowRight className="h-4 w-4" />
                    <span className="sr-only">Toggle Arc Mode</span>
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Arc</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    aria-label="Toggle Inhibitor Arc Mode"
                    pressed={isArcMode && activeArcType === 'inhibitor'}
                    onPressedChange={() => handleArcToggle('inhibitor')}
                  >
                    <ArcTypeIcon type="inhibitor" className="h-4 w-4" />
                    <span className="sr-only">Toggle Inhibitor Arc Mode</span>
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inhibitor Arc</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    aria-label="Toggle Reset Arc Mode"
                    pressed={isArcMode && activeArcType === 'reset'}
                    onPressedChange={() => handleArcToggle('reset')}
                  >
                    <ArcTypeIcon type="reset" className="h-4 w-4" />
                    <span className="sr-only">Toggle Reset Arc Mode</span>
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset Arc</p>
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
                    title="Annotation"
                    className="cursor-grab"
                  >
                    <div
                      draggable
                      onDragStart={(event) => onDragStart(event, "auxText")}
                    >
                      <LetterText className="h-5 w-5" />
                      <span className="sr-only">Drag a Text Annotation from Here</span>
                    </div>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Drag a Text Annotation from Here</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2 h-6">
          <Separator orientation="vertical" className="mx-1 h-6" />
        </div>

        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Toggle
                    aria-label="Toggle Marking Display"
                    pressed={showMarkingDisplay}
                    onPressedChange={setShowMarkingDisplay}
                  >
                    <SquareStack className="h-4 w-4 text-green-600" />
                    <span className="sr-only">Toggle Marking Display</span>
                  </Toggle>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle Marking Display</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

