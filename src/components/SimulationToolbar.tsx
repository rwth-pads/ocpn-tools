import { Button } from "@/components/ui/button";
import { Rewind, Play, FastForward } from "lucide-react";
import { useState } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { useSimulationController } from '@/hooks/useSimulationController';

export function SimulationToolbar() {
  const { reset, runStep } = useSimulationController();
  const [isRunningMultipleSteps, setIsRunningMultipleSteps] = useState(false);

  const handleReset = () => {
    reset();
  };

  const handleRunStep = () => {
    runStep();
  };

  const handleRunMultipleSteps = async (steps: number) => {
    setIsRunningMultipleSteps(true);
    try {
      for (let i = 0; i < steps; i++) {
        runStep();
        // Add a small delay to simulate step execution
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      setIsRunningMultipleSteps(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" title="Reset Simulation" onClick={handleReset}>
                <Rewind className="h-5 w-5" />
                <span className="sr-only">Reset Simulation</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset Simulation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" title="Run Simulation Step" onClick={handleRunStep}>
                <Play className="h-5 w-5" />
                <span className="sr-only">Run Simulation Step</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run Simulation Step</p>
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
                title="Run 50 Steps"
                onClick={() => handleRunMultipleSteps(100)}
                disabled={isRunningMultipleSteps}
                className="relative"
              >
                <FastForward className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                  100
                </span>
                <span className="sr-only">Run 100 Steps</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run 100 Steps</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
