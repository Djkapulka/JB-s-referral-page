import * as React from "react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        "mt-0.5 h-5 w-5 shrink-0 rounded border-border text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
        className,
      )}
      {...props}
    />
  );
});
Checkbox.displayName = "Checkbox";

export { Checkbox };
