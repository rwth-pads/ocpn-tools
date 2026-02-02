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
    isRunning,
    simulationConfig
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
    runMultipleStepsAnimated(simulationConfig.stepsPerRun, simulationConfig.animationDelayMs);
  };

  const handleRunFast = () => {
    runMultipleStepsFast(simulationConfig.stepsPerRun);
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

        {/* Play Button - Run steps with animation */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRunAnimated}
                disabled={isRunning}
                className="relative"
              >
                <Play className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                  {simulationConfig.stepsPerRun}
                </span>
                <span className="sr-only">Run {simulationConfig.stepsPerRun} Steps (Animated)</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run {simulationConfig.stepsPerRun} Steps (with intermediate markings)</p>
          </TooltipContent>
        </Tooltip>

        {/* Fast Forward Button - Run steps instantly */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRunFast}
                disabled={isRunning}
                className="relative"
              >
                <FastForward className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                  {simulationConfig.stepsPerRun}
                </span>
                <span className="sr-only">Run {simulationConfig.stepsPerRun} Steps (Fast)</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run {simulationConfig.stepsPerRun} Steps (without intermediate markings)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
