import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Input, Button } from "@/components/ui";
import type { EpisodeItem, CreateEpisodeRequest } from "@/types/episode.types";

// ── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
          checked ? "bg-blue-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

// ── Field wrapper ────────────────────────────────────────────────────────────
function FieldRow({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Main Panel ───────────────────────────────────────────────────────────────
interface Props {
  mode: string | null; // 'new' | 'edit' | null
  episode: EpisodeItem | null;
  onClose: () => void;
  onSubmit: (data: CreateEpisodeRequest) => void;
  isSaving: boolean;
}

const emptyForm = (): CreateEpisodeRequest => ({
  title: "",
  description: "",
  thumbnailUrl: "",
  airedDate: "",
  isVipOnly: false,
  hasVietsub: false,
  hasEngsub: false,
});

export function EpisodeFormPanel({ mode, episode, onClose, onSubmit, isSaving }: Props) {
  const [form, setForm] = useState<CreateEpisodeRequest>(emptyForm());

  // Sync from selected episode when editing
  useEffect(() => {
    if (mode === "edit" && episode) {
      setForm({
        title: episode.title ?? "",
        description: episode.description ?? "",
        thumbnailUrl: episode.thumbnailUrl ?? "",
        airedDate: episode.airedDate ?? "",
        isVipOnly: episode.isVipOnly,
        hasVietsub: episode.hasVietsub,
        hasEngsub: episode.hasEngsub,
      });
    } else if (mode === "new") {
      setForm(emptyForm());
    }
  }, [mode, episode]);

  const set = <K extends keyof CreateEpisodeRequest>(key: K, value: CreateEpisodeRequest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!mode) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Slide-in panel */}
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            {mode === "edit"
              ? `Sửa Tập ${String(episode?.episodeNumber ?? 0).padStart(2, "0")}`
              : "Thêm tập mới"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {/* Basic fields */}
            <FieldRow label="Tên tập" required>
              <Input
                value={form.title ?? ""}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ví dụ: Khởi đầu hành trình"
                className="border-slate-300 bg-white h-8 text-sm"
                required
              />
            </FieldRow>

            <FieldRow label="Mô tả">
              <textarea
                value={form.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Nội dung tập phim…"
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </FieldRow>

            <FieldRow label="Ngày phát sóng">
              <Input
                type="date"
                value={form.airedDate ?? ""}
                onChange={(e) => set("airedDate", e.target.value)}
                className="border-slate-300 bg-white h-8 text-sm"
              />
            </FieldRow>

            <FieldRow label="Thumbnail URL">
              <Input
                value={form.thumbnailUrl ?? ""}
                onChange={(e) => set("thumbnailUrl", e.target.value)}
                placeholder="https://cdn.example.com/ep01.jpg"
                className="border-slate-300 bg-white h-8 text-sm"
              />
              {form.thumbnailUrl && (
                <img
                  src={form.thumbnailUrl}
                  alt="preview"
                  className="mt-1.5 h-20 w-full rounded-md object-cover border border-slate-200"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              )}
            </FieldRow>

            {/* Toggles */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-3.5">
              <Toggle
                label="Có Vietsub"
                checked={form.hasVietsub ?? false}
                onChange={(v) => set("hasVietsub", v)}
              />
              <Toggle
                label="Có Engsub"
                checked={form.hasEngsub ?? false}
                onChange={(v) => set("hasEngsub", v)}
              />
              <Toggle
                label="Chỉ dành cho VIP"
                checked={form.isVipOnly ?? false}
                onChange={(v) => set("isVipOnly", v)}
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-slate-300 bg-white text-slate-700 text-sm h-8"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 text-white hover:bg-blue-700 text-sm h-8 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
              {mode === "edit" ? "Lưu thay đổi" : "Tạo tập"}
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}

