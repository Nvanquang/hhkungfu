import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses: Record<NonNullable<SpinnerProps["size"]>, string> = {
  xs: "h-3 w-3 border",
  sm: "h-4 w-4 border-2",
  md: "h-5 w-5 border-2",
  lg: "h-6 w-6 border-2",
};

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <div
      aria-label="Loading"
      className={cn(
        "inline-block animate-spin rounded-full border-muted-foreground/30 border-t-muted-foreground",
        sizeClasses[size],
        className
      )}
    />
  );
}

