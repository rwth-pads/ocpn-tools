import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pauseUndo, resumeUndo } from "@/stores/store";

/**
 * Input wrapper that pauses undo tracking while the user is typing,
 * so that individual keystrokes are not recorded as separate undo entries.
 * The entire edit session (focus → blur) becomes a single undo step.
 */
const UndoableInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ onFocus, onBlur, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      onFocus={(e) => {
        pauseUndo();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        resumeUndo();
        onBlur?.(e);
      }}
      {...props}
    />
  );
});
UndoableInput.displayName = "UndoableInput";

/**
 * Textarea wrapper that pauses undo tracking while the user is typing.
 */
const UndoableTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<typeof Textarea>
>(({ onFocus, onBlur, ...props }, ref) => {
  return (
    <Textarea
      ref={ref}
      onFocus={(e) => {
        pauseUndo();
        onFocus?.(e);
      }}
      onBlur={(e) => {
        resumeUndo();
        onBlur?.(e);
      }}
      {...props}
    />
  );
});
UndoableTextarea.displayName = "UndoableTextarea";

export { UndoableInput, UndoableTextarea };
