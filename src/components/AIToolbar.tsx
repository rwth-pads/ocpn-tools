import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

export function AIToolbar({ onToggleAIAssistant }: { onToggleAIAssistant: () => void }) {

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" onClick={onToggleAIAssistant}>
                <Sparkles className="h-5 w-5" />
                <span className="sr-only">Toggle AI Assistant</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Toggle AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
