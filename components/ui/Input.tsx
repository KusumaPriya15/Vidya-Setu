
import React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | null;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, error, icon, ...props }, ref) => {
    const hasError = !!error;
    
    if (icon) {
      return (
        <div className={cn("flex items-center h-11 md:h-10 w-full rounded-md border-2 px-3 transition-colors overflow-hidden focus-within:border-indigo-500", hasError && "border-red-500 focus-within:border-red-600", className)} style={{ backgroundColor: 'var(--card-bg)', borderColor: hasError ? 'hsl(0 65% 50%)' : 'var(--border-default)', ...style }}>
          <span className="shrink-0 mr-2 flex items-center justify-center text-slate-400">
            {icon}
          </span>
          <input
            type={type}
            className="flex-1 bg-transparent border-none outline-none text-sm w-full h-full disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--text-main)' }}
            aria-invalid={hasError}
            aria-describedby={hasError && props.id ? `${props.id}-error` : undefined}
            ref={ref}
            {...props}
          />
        </div>
      );
    }

    return (
      <input
        type={type}
        className={cn(
          "flex h-11 md:h-10 w-full rounded-md border-2 px-3 py-2 text-sm focus-visible:outline-none focus-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-50 input-themed",
          hasError && "border-red-500 focus:border-red-600",
          className
        )}
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: hasError ? 'hsl(0 65% 50%)' : 'var(--border-default)',
          color: 'var(--text-main)',
          ...style
        }}
        aria-invalid={hasError}
        aria-describedby={hasError && props.id ? `${props.id}-error` : undefined}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }