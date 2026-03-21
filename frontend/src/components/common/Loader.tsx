import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fullPage?: boolean;
}

export function Loader({ className, size = "md", fullPage = false }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const content = (
    <div className={cn("flex items-center justify-center", !fullPage && className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
    </div>
  );

  if (fullPage) {
    return (
      <div className={cn("fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm", className)}>
        {content}
      </div>
    );
  }

  return content;
}
