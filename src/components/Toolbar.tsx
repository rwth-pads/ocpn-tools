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
import { useShallow } from 'zustand/react/shallow';
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

  // Hierarchy: get selected element info
  const activePetriNetId = useStore((state) => state.activePetriNetId);
  const selectedElement = useStore((state) => {
    const net = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return net?.selectedElement;
  });
  // Get all selected nodes (for multi-select move to subpage)
  const selectedNodes = useStore(useShallow((state) => {
    const net = state.activePetriNetId ? state.petriNetsById[state.activePetriNetId] : null;
    return net?.nodes.filter((n) => n.selected) || [];
  }));
  const moveTransitionToSubpage = useStore((state) => state.moveTransitionToSubpage);
  const moveNodesToSubpage = useStore((state) => state.moveNodesToSubpage);
  const flattenSubstitutionTransition = useStore((state) => state.flattenSubstitutionTransition);

  // Determine if selected element is a single transition (and whether it's a substitution transition)
  const isTransitionSelected = selectedElement?.type === 'node' && selectedElement.element?.type === 'transition';
  const selectedTransitionId = isTransitionSelected ? selectedElement.element.id : null;
  const isSubstitutionTransition = isTransitionSelected && !!selectedElement.element?.data?.subPageId;

  // Multi-selection: at least one transition selected, none are substitution transitions
  const multiSelectedTransitions = selectedNodes.filter((n) => n.type === 'transition');
  const hasMultiSelection = selectedNodes.length > 1 && multiSelectedTransitions.length > 0;
  const multiHasSubstitution = multiSelectedTransitions.some((t) => t.data?.subPageId);

  // Can move to subpage: either single transition or multi-selection with transitions
  const canMoveToSubpage = (!hasMultiSelection && isTransitionSelected && !isSubstitutionTransition)
    || (hasMultiSelection && !multiHasSubstitution);

  const handleMoveToSubpage = () => {
    if (!activePetriNetId) return;
    if (hasMultiSelection) {
      // Multi-node move
      const nodeIds = selectedNodes.map((n) => n.id);
      moveNodesToSubpage(activePetriNetId, nodeIds);
    } else if (selectedTransitionId && !isSubstitutionTransition) {
      // Single transition move
      moveTransitionToSubpage(activePetriNetId, selectedTransitionId);
    }
  };

  const handleFlattenSubpage = () => {
    if (activePetriNetId && selectedTransitionId && isSubstitutionTransition) {
      flattenSubstitutionTransition(activePetriNetId, selectedTransitionId);
    }
  };

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

        {/* Hierarchy buttons */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Move to Subpage"
                    disabled={!canMoveToSubpage}
                    onClick={handleMoveToSubpage}
                  >
                    {/* Hierarchy: transition with arrow to subpage icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="6" width="8" height="6" rx="0.5" />
                      <rect x="16" y="3" width="6" height="4" rx="0.5" />
                      <rect x="16" y="10" width="6" height="4" rx="0.5" />
                      <path d="M10 9h3m0 0l-1.5-1.5M13 9l-1.5 1.5" />
                      <line x1="13" y1="5" x2="16" y2="5" />
                      <line x1="13" y1="12" x2="16" y2="12" />
                    </svg>
                    <span className="sr-only">Move to Subpage</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Move to Subpage</p>
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
                    title="Replace Substitution Transition by Subpage"
                    disabled={!isSubstitutionTransition}
                    onClick={handleFlattenSubpage}
                  >
                    {/* Flatten: subpage content replacing transition icon */}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="14" y="6" width="8" height="6" rx="0.5" />
                      <rect x="2" y="3" width="6" height="4" rx="0.5" />
                      <rect x="2" y="10" width="6" height="4" rx="0.5" />
                      <path d="M14 9h-3m0 0l1.5-1.5M11 9l1.5 1.5" />
                      <line x1="8" y1="5" x2="11" y2="5" />
                      <line x1="8" y1="12" x2="11" y2="12" />
                    </svg>
                    <span className="sr-only">Replace Substitution Transition by Subpage</span>
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Replace Substitution Transition by Subpage</p>
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

