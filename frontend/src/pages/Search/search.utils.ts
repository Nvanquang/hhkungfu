// Đọc/ghi danh sách từ khóa tìm kiếm gần đây vào localStorage, giới hạn 5 từ khóa.
const RECENT_KEY = "recent_search_keywords";

export function readRecentKeywords(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(arr)) return [];
    return arr.filter((x) => typeof x === "string").slice(0, 5);
  } catch {
    return [];
  }
}

export function writeRecentKeyword(keyword: string) {
  const k = keyword.trim();
  if (!k) return;
  const current = readRecentKeywords();
  const next = [k, ...current.filter((x) => x.toLowerCase() !== k.toLowerCase())].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}