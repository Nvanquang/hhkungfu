import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui";

interface MobileHeaderProps {
  mobileOpen: boolean;
  setMobileOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  pageTitle: string;
}

export function MobileHeader({ mobileOpen, setMobileOpen, pageTitle }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="text-slate-700"
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
      <p className="text-sm font-semibold text-slate-900">{pageTitle}</p>
    </header>
  );
}
