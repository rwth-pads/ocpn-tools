import { Button } from "@/components/ui/button";
import { RotateCcw, Square, SkipForward, Play, FastForward } from "lucide-react";
import { useContext } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { SimulationContext } from '@/context/useSimulationContextHook';

export function SimulationToolbar() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('SimulationToolbar must be used within a SimulationProvider');
  }
  const { 
    reset, 
    runStep, 
    runMultipleStepsAnimated, 
    runMultipleStepsFast,
    stop,
    isRunning 
  } = context;

  const handleReset = () => {
    reset();
  };

  const handleStop = () => {
    stop();
  };

  const handleRunStep = () => {
    runStep();
  };

  const handleRunAnimated = () => {
    runMultipleStepsAnimated(50, 50);
  };

  const handleRunFast = () => {
    runMultipleStepsFast(50);
  };

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        {/* Rewind/Reset Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Reset Simulation" 
                onClick={handleReset}
                disabled={isRunning}
              >
                <RotateCcw className="h-5 w-5" />
                <span className="sr-only">Reset Simulation</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset Simulation</p>
          </TooltipContent>
        </Tooltip>

        {/* Stop Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Stop Simulation" 
                onClick={handleStop}
                disabled={!isRunning}
              >
                <Square className="h-5 w-5" />
                <span className="sr-only">Stop Simulation</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Stop Simulation</p>
          </TooltipContent>
        </Tooltip>

        {/* Single Step Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button 
                variant="ghost" 
                size="icon" 
                title="Execute One Step" 
                onClick={handleRunStep}
                disabled={isRunning}
              >
                <SkipForward className="h-5 w-5" />
                <span className="sr-only">Execute One Step</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Execute One Step</p>
          </TooltipContent>
        </Tooltip>

        {/* Play Button - Run 50 steps with animation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                title="Run 50 Steps (Animated)"
                onClick={handleRunAnimated}
                disabled={isRunning}
                className="relative"
              >
                <Play className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                  50
                </span>
                <span className="sr-only">Run 50 Steps (Animated)</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run 50 Steps (with intermediate markings)</p>
          </TooltipContent>
        </Tooltip>

        {/* Fast Forward Button - Run 50 steps instantly */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                title="Run 50 Steps (Fast)"
                onClick={handleRunFast}
                disabled={isRunning}
                className="relative"
              >
                <FastForward className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                  50
                </span>
                <span className="sr-only">Run 50 Steps (Fast)</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run 50 Steps (without intermediate markings)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
