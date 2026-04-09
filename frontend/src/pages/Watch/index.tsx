import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronLeft, Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useWatch } from "./hooks/useWatch";
import { WatchNavbar } from "./components/WatchNavbar";
import { VideoPlayer } from "./components/VideoPlayer";
import { VideoInfo } from "./components/VideoInfo";
import { EpisodeListSidebar } from "./components/EpisodeListSidebar";
import { EpisodeGrid } from "./components/EpisodeGrid";
import { WatchSkeleton } from "./components/WatchSkeleton";
import { CommentsTab } from "../AnimeDetail/components/tabs/CommentsTab";

export default function Watch() {
  const { animeSlug = "", episodeNumber = "1" } = useParams<{
    animeSlug: string;
    episodeNumber: string;
  }>();
  const navigate = useNavigate();

  // Scroll to top when episode changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [animeSlug, episodeNumber]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    anime,
    episode,
    episodes,
    streamInfo,
    prevEpisode,
    nextEpisode,
    isLoading,
    isError,
    isStreamLoading,
    isVipRequired,
    isNotReady,
  } = useWatch(animeSlug, episodeNumber);

  // Full-page loading state
  if (isLoading) return <WatchSkeleton />;

  // Anime or episode not found
  if (isError || !episode) {
    return (
      <div className="flex flex-col min-h-screen bg-black items-center justify-center gap-6 text-white px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-black tracking-tight uppercase">Không tìm thấy</h1>
          <p className="text-sm text-white/50 max-w-sm">
            Tập phim hoặc Anime này không tồn tại hoặc đã bị gỡ bỏ. Vui lòng kiểm tra lại đường dẫn.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-none gap-2 border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-4 h-4" /> Quay lại
          </Button>
          <Button
            size="lg"
            className="flex-1 sm:flex-none gap-2 font-bold"
            onClick={() => navigate("/")}
          >
            <Home className="w-4 h-4" /> Trang chủ
          </Button>
        </div>
      </div>
    );
  }

  const epNum = parseInt(episodeNumber, 10);

  return (
    // Full-height dark layout — no MainLayout header/footer
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-black text-white overflow-x-hidden">
      {/* Slim dark navbar */}
      <WatchNavbar
        animeTitle={anime?.title ?? null}
        animeSlug={animeSlug}
        episodeTitle={episode.title}
        episodeNumber={epNum}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:flex-row gap-0 lg:gap-4 lg:p-4 lg:items-start overflow-y-auto lg:overflow-hidden">

        {/* Left column: player + info + mobile episode grid */}
        <div className="flex-1 flex flex-col min-w-0 gap-4 lg:h-full lg:overflow-y-auto scrollbar-hide lg:scrollbar-default">

          {/* VIDEO PLAYER AREA */}
          {isStreamLoading && !streamInfo && !isVipRequired ? (
            <div className="w-full aspect-video bg-black/50 flex items-center justify-center rounded-none lg:rounded-xl">
              <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
            </div>
          ) : isNotReady ? (
            <div className="w-full aspect-video bg-black/50 flex flex-col items-center justify-center gap-3 rounded-none lg:rounded-xl">
              <AlertTriangle className="w-8 h-8 text-amber-400" />
              <p className="text-sm text-white/60 text-center px-4">
                Video của tập này chưa sẵn sàng (đang xử lý hoặc gặp lỗi).
              </p>
            </div>
          ) : (streamInfo || isVipRequired) ? (
            <div className="rounded-none lg:rounded-xl overflow-hidden">
              <VideoPlayer
                videoRef={videoRef}
                streamInfo={streamInfo ?? {
                  episodeId: episode.id,
                  videoStatus: "READY",
                  masterUrl: "",
                  qualities: [],
                  subtitles: [],
                  durationSeconds: episode.durationSeconds ?? 0,
                }}
                episode={episode}
                nextEpisode={nextEpisode}
                animeSlug={animeSlug}
                isVipRequired={isVipRequired}
              />
            </div>
          ) : null}

          {/* VIDEO INFO SECTION */}
          <div className="px-4 lg:px-0">
            <VideoInfo
              animeSlug={animeSlug}
              animeTitle={anime?.title ?? null}
              episode={episode}
              prevEpisode={prevEpisode}
              nextEpisode={nextEpisode}
            />
          </div>

          {/* MOBILE EPISODE GRID */}
          <div className="px-4 lg:px-0 pb-4">
            <EpisodeGrid
              animeSlug={animeSlug}
              episodes={episodes}
              currentEpisodeNumber={epNum}
            />
          </div>

          {/* COMMENTS (Mobile & Desktop) */}
          <div className="mt-2 px-4 lg:px-0">
            <CommentsTab episodeId={episode.id} />
          </div>
        </div>

        {/* Right column: desktop episode sidebar */}
        <EpisodeListSidebar
          animeSlug={animeSlug}
          animeTitle={anime?.title ?? null}
          episodes={episodes}
          currentEpisodeNumber={epNum}
          isLoading={episodes.length === 0}
        />
      </div>
    </div>
  );
}
