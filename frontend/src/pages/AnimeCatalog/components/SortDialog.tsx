import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui";
import type { AnimeQueryParams } from "@/types/anime.types";
import { SORT_OPTIONS, ORDER_OPTIONS, SORT_LABEL, ORDER_LABEL } from "../catalog.constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  params: AnimeQueryParams;
  setParam: (key: string, value: string | number | undefined | null) => void;
}

export function SortDialog({ open, onOpenChange, params, setParam }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sắp xếp</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            {SORT_OPTIONS.map((s) => (
              <Button
                key={s}
                variant={(params.sort === s || (!params.sort && s === "viewCount")) ? "default" : "outline"}
                onClick={() => setParam("sort", s)}
              >
                {SORT_LABEL[s]}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {ORDER_OPTIONS.map((o) => (
              <Button
                key={o}
                variant={(params.order === o || (!params.order && o === "desc")) ? "default" : "outline"}
                onClick={() => setParam("order", o)}
              >
                {ORDER_LABEL[o]}
              </Button>
            ))}
          </div>

          <div className="pt-2">
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Xong
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}