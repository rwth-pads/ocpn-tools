import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A textarea that looks and behaves like a single-line input by default,
 * but automatically expands to multiple lines when the content contains
 * newline characters or the user presses Enter.
 */
const AutoExpandingInput = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, value, onChange, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement | null>(null);

  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
          node;
      }
    },
    [ref]
  );

  const adjustHeight = React.useCallback(() => {
    const textarea = internalRef.current;
    if (!textarea) return;
    // Reset to single-line height to measure scrollHeight correctly
    textarea.style.height = "auto";
    // Set to scrollHeight so all lines are visible
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  React.useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  return (
    <textarea
      ref={setRefs}
      rows={1}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        // Height will be adjusted by the useEffect on value change
      }}
      className={cn(
        // Base input styles (matching Input component)
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Override textarea defaults to look like an input
        "resize-none overflow-hidden leading-[1.5] min-h-0",
        className
      )}
      {...props}
    />
  );
});
AutoExpandingInput.displayName = "AutoExpandingInput";

export { AutoExpandingInput };
