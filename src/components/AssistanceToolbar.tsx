import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle, Sparkles } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { HelpDialog } from '@/components/dialogs/HelpDialog';

export function AssistanceToolbar({ onToggleAIAssistant }: { onToggleAIAssistant: () => void }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button variant="ghost" size="icon" onClick={() => setIsHelpOpen(true)}>
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help & Documentation</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Help & Documentation</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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

      <HelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </div>
  );
};
