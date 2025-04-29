import { Button } from "@/components/ui/button";
import { Rewind, Play, FastForward } from "lucide-react";
import { useState, useContext } from 'react';

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
  const { reset, runStep, ensureInitialized, _executeWasmStep } = context;

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
      await ensureInitialized();
      for (let i = 0; i < steps; i++) {
        _executeWasmStep();
        await new Promise(resolve => setTimeout(resolve, 50));
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
                onClick={() => handleRunMultipleSteps(50)}
                disabled={isRunningMultipleSteps}
                className="relative"
              >
                <FastForward className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-medium">
                  50
                </span>
                <span className="sr-only">Run 50 Steps</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Run 50 Steps</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
