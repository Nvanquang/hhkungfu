// Entry point trang tìm kiếm, giữ input state và URL sync, delegate render xuống SearchBar và SearchResults.
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Breadcrumb } from "@/components/features/Breadcrumb";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import { useSearchData } from "./hooks/useSearchData";
import { readRecentKeywords, writeRecentKeyword } from "./search.utils";
import { SearchBar } from "./components/SearchBar";
import { SearchResults } from "./components/SearchResults";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get("key") || "";

  const [inputValue, setInputValue] = useState(initialQ);
  const debouncedInput = useDebouncedValue(inputValue, 300);
  const [isFocused, setIsFocused] = useState(false);
  const [recentKeywords, setRecentKeywords] = useState<string[]>(() => readRecentKeywords());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInputValue(initialQ); }, [initialQ]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [debouncedInput]);

  const committedQ = initialQ.trim();

  const {
    suggestions, isSuggestionLoading,
    results, pagination, meta, isResultsLoading, isResultsError, refetchResults,
    trending,
  } = useSearchData(debouncedInput, committedQ, isFocused);

  const onSubmit = (key: string) => {
    const nextQ = key.trim();
    if (!nextQ) return;
    writeRecentKeyword(nextQ);
    setRecentKeywords(readRecentKeywords());
    const next = new URLSearchParams(searchParams);
    next.set("key", nextQ);
    setSearchParams(next, { replace: true });
    inputRef.current?.blur();
  };

  const onClear = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("key");
    setSearchParams(next, { replace: true });
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <Breadcrumb
        items={[
          { label: committedQ ? `Kết quả cho "${committedQ}"` : "Tìm kiếm" },
        ]}
      />
      <SearchBar
        inputValue={inputValue}
        debouncedInput={debouncedInput}
        recentKeywords={recentKeywords}
        suggestions={suggestions}
        isSuggestionLoading={isSuggestionLoading}
        onInputChange={setInputValue}
        onSubmit={onSubmit}
        onClear={onClear}
        onFocus={() => { setIsFocused(true); setRecentKeywords(readRecentKeywords()); }}
        onBlur={() => { window.setTimeout(() => setIsFocused(false), 150); }}
        isFocused={isFocused}
        inputRef={inputRef}
      />

      <SearchResults
        committedQ={committedQ}
        results={results}
        pagination={pagination}
        meta={meta}
        isLoading={isResultsLoading}
        isError={isResultsError}
        trending={trending}
        onRefetch={refetchResults}
        onSubmit={onSubmit}
      />
    </div>
  );
}