import { useParams, useLocation, Link } from "react-router-dom";
import { useVideoUpload } from "./hooks/useVideoUpload";
import { UploadDropZone } from "./components/UploadDropZone";
import { TranscodeProgress } from "./components/TranscodeProgress";
import { EpisodeInfoPanel } from "./components/EpisodeInfoPanel";
import type { EpisodeItem } from "@/types/episode.types";
import type { AnimeSummary } from "@/types/anime.types";

export default function VideoUploadPage() {
  const { episodeId } = useParams<{ episodeId: string }>();
  const id = Number(episodeId);

  const location = useLocation();

  // Retrieve passed information from EpisodeTable (avoids redundant/failing API calls for PENDING episodes)
  const episodeFromState = location.state?.episode as EpisodeItem | undefined;
  const animeFromState = location.state?.anime as AnimeSummary | undefined;
  const animeIdFromState = location.state?.animeId as number | undefined;

  // Infer animeId from state
  const animeId = animeFromState?.id ?? animeIdFromState ?? 0;


  const {
    state,
    streamInfo,
    selectedQualities,
    handleFileChange,
    toggleQuality,
    startUpload,
    cancelUpload,
    retry,
  } = useVideoUpload(id);

  // Build a minimal EpisodeItem-like object for the info panel
  const displayEpisode = episodeFromState ?? ({
    id,
    animeId,
    episodeNumber: id,
    videoStatus: streamInfo?.videoStatus ?? 'PENDING',
  } as any);

  return (
    <div className="space-y-4">
      {/* Breadcrumb & Navigation */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <nav className="mb-3 flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/admin/animes" className="hover:text-slate-800 hover:underline">
            Danh sách Anime
          </Link>
          <span>/</span>
          <Link
            to={animeId ? `/admin/animes/${animeId}/episodes` : "#"}
            className="hover:text-slate-800 hover:underline"
          >
            {animeFromState?.titleVi ?? `Anime #${animeId}`}
          </Link>
          <span>/</span>
          <Link
            to={animeId ? `/admin/animes/${animeId}/episodes` : "#"}
            className="hover:text-slate-800 hover:underline"
          >
            Quản lý tập
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Tải video</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Upload Video</p>
            <h1 className="text-base font-semibold text-slate-900 mt-0.5">
              {animeFromState?.title ?? "Anime"} — Tập {displayEpisode?.episodeNumber ?? episodeId}
            </h1>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-800 mb-4">Upload file</p>
            <UploadDropZone
              uploadState={state}
              onFileChange={handleFileChange}
              onStart={startUpload}
              onCancel={cancelUpload}
            />
          </section>

          <TranscodeProgress
            phase={state.phase}
            streamInfo={streamInfo as any}
            animeId={animeId}
            onRetry={retry}
          />
        </div>

        {/* Right column */}
        <EpisodeInfoPanel
          episode={displayEpisode}
          streamInfo={streamInfo as any}
          animeId={animeId}
          title={animeFromState?.title ?? "Anime"}
          selectedQualities={selectedQualities}
          onToggleQuality={toggleQuality}
        />
      </div>
    </div>
  );
}
