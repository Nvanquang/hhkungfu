// Thanh tìm kiếm với dropdown gợi ý: hiển thị từ khóa gần đây khi input trống, suggestions từ API khi đang gõ.
import { Link } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { Input, Skeleton } from "@/components/ui";

interface Suggestion {
  id: number;
  slug?: string | null;
  title?: string | null;
  thumbnailUrl?: string | null;
  type?: string | null;
  status?: string | null;
  malScore?: number | null;
}

interface Props {
  inputValue: string;
  debouncedInput: string;
  recentKeywords: string[];
  suggestions: Suggestion[];
  isSuggestionLoading: boolean;
  onInputChange: (v: string) => void;
  onSubmit: (key: string) => void;
  onClear: () => void;
  onFocus: () => void;
  onBlur: () => void;
  isFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function SearchBar({
  inputValue, debouncedInput, recentKeywords, suggestions, isSuggestionLoading,
  onInputChange, onSubmit, onClear, onFocus, onBlur, isFocused, inputRef,
}: Props) {
  const showSuggestions = isFocused && (debouncedInput.trim().length > 0 || recentKeywords.length > 0);

  const suggestionTitle = debouncedInput.trim()
    ? `"${debouncedInput.trim()}" trong toàn bộ anime`
    : "Từ khóa gần đây";

  return (
    <div className="relative max-w-3xl">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(inputValue); }} className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Tìm anime, tên nhân vật..."
          className="h-11 pl-9 pr-10 rounded-full bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary"
        />
        {inputValue ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      {showSuggestions ? (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 text-sm font-semibold">
            <span className="inline-flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-muted-foreground" /> {suggestionTitle}
            </span>
          </div>
          <div className="border-t border-border/50" />

          {debouncedInput.trim().length === 0 ? (
            <div className="p-2">
              {recentKeywords.map((k) => (
                <button
                  key={k}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSubmit(k)}
                  className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-muted"
                >
                  {k}
                </button>
              ))}
            </div>
          ) : isSuggestionLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-7 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length ? (
            <div className="p-2">
              {suggestions.slice(0, 5).map((a) => (
                <Link
                  key={a.id}
                  to={`/anime/${a.slug}`}
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted"
                >
                  <div className="h-10 w-7 rounded bg-muted overflow-hidden shrink-0">
                    {a.thumbnailUrl ? (
                      <img src={a.thumbnailUrl} alt={a.title as string} className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.type} · {a.status} · ⭐ {a.malScore ?? "N/A"}
                    </p>
                  </div>
                </Link>
              ))}
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSubmit(debouncedInput)}
                className="w-full text-left rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-muted"
              >
                Xem tất cả kết quả cho "{debouncedInput.trim()}" →
              </button>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">Không có gợi ý.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}