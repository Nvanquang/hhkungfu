import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Loader2 } from "lucide-react";
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
      <div className="flex flex-col min-h-screen bg-black items-center justify-center gap-4 text-white">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <p className="text-lg font-semibold">Không tìm thấy tập phim</p>
        <p className="text-sm text-white/50">
          Anime hoặc tập phim này không tồn tại. Vui lòng kiểm tra lại đường dẫn.
        </p>
      </div>
    );
  }

  const epNum = parseInt(episodeNumber, 10);

  return (
    // Full-height dark layout — no MainLayout header/footer
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Slim dark navbar */}
      <WatchNavbar
        animeTitle={anime?.title ?? null}
        animeSlug={animeSlug}
        episodeTitle={episode.title}
        episodeNumber={epNum}
      />

      {/* Main content area */}
      <div className="flex flex-1 gap-0 lg:gap-4 lg:p-4 lg:items-start overflow-hidden">

        {/* Left column: player + info + mobile episode grid */}
        <div className="flex-1 flex flex-col min-w-0 gap-4">

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
