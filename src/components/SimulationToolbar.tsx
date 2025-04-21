import { Button } from "@/components/ui/button";
import { Rewind, Play } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { useSimulationController } from '@/hooks/useSimulationController';

export function SimulationToolbar() {
  const { reset, runStep } = useSimulationController();

  const handleReset = () => {
    reset();
  };

  const handleRunStep = () => {
    runStep();
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
    </div>
  );
};
