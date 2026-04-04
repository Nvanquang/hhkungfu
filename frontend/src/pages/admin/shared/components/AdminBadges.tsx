import { Badge } from "@/components/ui";
import type { AnimeStatus } from "@/types/anime.types";
import type { VideoStatus } from "@/types/episode.types";

export function AnimeStatusBadge({ status }: { status: AnimeStatus }) {
  if (status === "ONGOING") {
    return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">ONGOING</Badge>;
  }
  if (status === "UPCOMING") {
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">UPCOMING</Badge>;
  }
  return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">COMPLETED</Badge>;
}

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  if (status === "READY") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">READY</Badge>;
  if (status === "PROCESSING") return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">PROCESSING</Badge>;
  if (status === "FAILED") return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">FAILED</Badge>;
  return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">PENDING</Badge>;
}
