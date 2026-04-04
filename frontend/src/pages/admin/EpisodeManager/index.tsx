import { useParams } from "react-router-dom";
import { useEpisodeManager } from "./hooks/useEpisodeManager";
import { EpisodeHeader } from "./components/EpisodeHeader";
import { EpisodeTable } from "./components/EpisodeTable";
import { EpisodeFormPanel } from "./components/EpisodeFormPanel";
import { TranscodeHistoryModal } from "./components/TranscodeHistoryModal";

export default function EpisodeManagerPage() {
  const { id } = useParams<{ id: string }>();
  const animeId = Number(id);

  const {
    animeQuery,
    episodesQuery,
    panelMode,
    historyEpisodeId,
    openNewPanel,
    closePanel,
    openHistory,
    closeHistory,
    deleteMutation,
    createMutation,
  } = useEpisodeManager(animeId);

  const anime = animeQuery.data?.data;
  const episodes = episodesQuery.data?.items ?? [];
  const isLoadingEpisodes = episodesQuery.isLoading;
  const isSaving = createMutation.isPending;


  // Resolve episode for history modal
  const historyEpisode = historyEpisodeId
    ? episodes.find((ep) => ep.id === historyEpisodeId) ?? null
    : null;

  return (
    <div className="space-y-4">
      <EpisodeHeader
        anime={anime ?? null}
        animeId={animeId}
        episodeCount={episodes.length}
        onAddNew={openNewPanel}
      />

      <EpisodeTable
        episodes={episodes}
        animeId={animeId}
        anime={anime}
        isLoading={isLoadingEpisodes}
        onHistory={openHistory}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <EpisodeFormPanel
        mode={panelMode}
        episode={null} // Tạm thời null vì tính năng Sửa đang bảo trì
        onClose={closePanel}
        onSubmit={(data) => createMutation.mutate(data)}
        isSaving={isSaving}
      />

      <TranscodeHistoryModal
        episode={historyEpisode}
        onClose={closeHistory}
      />
    </div>
  );
}

