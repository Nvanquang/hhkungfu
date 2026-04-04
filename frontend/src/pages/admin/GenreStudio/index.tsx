import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";
import { Dialog, DialogContent, Button } from "@/components/ui";
import { LightPanel, AdminPageHeader, AnimateNumber } from "@/pages/admin/shared/components";
import { GenreManager } from "./components/GenreManager";
import { StudioManager } from "./components/StudioManager";
import { GenreForm } from "./components/GenreForm";
import { StudioForm } from "./components/StudioForm";
import { useGenreStudio } from "./hooks/useGenreStudio";
import { GENRE_STUDIO_TABS } from "./genre-studio.constants";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GenreStudioPage() {
  const [activeTab, setActiveTab] = useState<string>(GENRE_STUDIO_TABS.GENRE);

  const {
    genres,
    studios,
    isLoading,
    isSaving,
    editingGenre,
    setEditingGenre,
    editingStudio,
    setEditingStudio,
    isFormOpen,
    setIsFormOpen,
    createGenre,
    updateGenre,
    deleteGenre,
    createStudio,
    updateStudio,
    deleteStudio,
  } = useGenreStudio();

  // Force scroll restoration to prevent jump when dialog opens
  useEffect(() => {
    if (isFormOpen) {
      const scrollPos = window.scrollY;
      const timer = requestAnimationFrame(() => {
        window.scrollTo(0, scrollPos);
      });
      return () => cancelAnimationFrame(timer);
    }
  }, [isFormOpen]);

  if (isLoading && genres.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleGenreSave = (data: any) => {
    if (editingGenre) {
      updateGenre({ id: editingGenre.id, data });
    } else {
      createGenre(data);
    }
  };

  const handleStudioSave = (data: any) => {
    if (editingStudio) {
      updateStudio({ id: editingStudio.id, data });
    } else {
      createStudio(data);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        <AdminPageHeader
          title="Thể loại & Studio"
          description="Quản lý phân loại nội dung và các xưởng sản xuất phim."
          rightElement={
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 h-10">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeTab === GENRE_STUDIO_TABS.GENRE ? "Thể loại" : "Studio"}
                </span>
                <span className="text-lg font-bold text-slate-900 border-l border-slate-200 pl-3">
                  <AnimateNumber value={activeTab === GENRE_STUDIO_TABS.GENRE ? genres.length : studios.length} />
                </span>
              </div>

              <Button
                type="button"
                onClick={() => {
                  if (activeTab === GENRE_STUDIO_TABS.GENRE) setEditingGenre(null);
                  else setEditingStudio(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all active:scale-95"
              >
                + Thêm {activeTab === GENRE_STUDIO_TABS.GENRE ? "Thể loại" : "Studio"}
              </Button>
            </div>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full flex flex-col gap-6"
        >
          <div className="border-b border-slate-200">
            <TabsList variant="line" className="bg-transparent h-auto p-0 gap-8">
              <TabsTrigger
                value={GENRE_STUDIO_TABS.GENRE}
                className={cn(
                  "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                  activeTab === GENRE_STUDIO_TABS.GENRE && "text-blue-600 font-bold"
                )}
              >
                Thể loại
              </TabsTrigger>
              <TabsTrigger
                value={GENRE_STUDIO_TABS.STUDIO}
                className={cn(
                  "relative h-11 bg-transparent px-2 pb-3 pt-2 font-medium text-slate-500 transition-all hover:text-blue-600/80",
                  activeTab === GENRE_STUDIO_TABS.STUDIO && "text-blue-600 font-bold"
                )}
              >
                Studio
              </TabsTrigger>
            </TabsList>
          </div>

          <LightPanel className="p-6">
            <TabsContent value={GENRE_STUDIO_TABS.GENRE} className="m-0 border-none p-0 outline-none">
              <GenreManager
                genres={genres}
                onEdit={(g) => { setEditingGenre(g); setIsFormOpen(true); }}
                onDelete={deleteGenre}
              />
            </TabsContent>

            <TabsContent value={GENRE_STUDIO_TABS.STUDIO} className="m-0 border-none p-0 outline-none">
              <StudioManager
                studios={studios}
                onEdit={(s) => { setEditingStudio(s); setIsFormOpen(true); }}
                onDelete={deleteStudio}
              />
            </TabsContent>
          </LightPanel>
        </Tabs>
      </div>

      {/* Form Dialog - Đưa hẳn ra ngoài loop để tránh tương tác layout */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen} modal={false}>
        <DialogContent
          className="sm:max-w-md p-6 overflow-hidden border-none bg-white shadow-2xl rounded-2xl"
          showCloseButton={true}
          initialFocus={false}
        >
          {activeTab === GENRE_STUDIO_TABS.GENRE ? (
            <GenreForm
              genre={editingGenre}
              onSave={(data) => { handleGenreSave(data); setIsFormOpen(false); }}
              onCancel={() => setIsFormOpen(false)}
              isLoading={isSaving}
            />
          ) : (
            <StudioForm
              studio={editingStudio}
              onSave={(data) => { handleStudioSave(data); setIsFormOpen(false); }}
              onCancel={() => setIsFormOpen(false)}
              isLoading={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
