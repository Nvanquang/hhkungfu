import { Button } from "@/components/ui";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  pagination: Pagination | undefined;
  setPage: (page: number) => void;
}

export function CatalogPagination({ pagination, setPage }: Props) {
  if (!pagination) return null;

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-between pt-4">
        <p className="text-sm text-muted-foreground">
          Hiển thị {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={pagination.page <= 1}
            onClick={() => setPage(pagination.page - 1)}
          >
            ← Trước
          </Button>
          <span className="text-sm font-semibold px-2">{pagination.page}</span>
          <Button
            variant="outline"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPage(pagination.page + 1)}
          >
            Tiếp →
          </Button>
        </div>
      </div>

      {/* Mobile load more */}
      {pagination.page < pagination.totalPages ? (
        <div className="lg:hidden pt-4">
          <Button variant="outline" className="w-full" onClick={() => setPage(pagination.page + 1)}>
            Tải thêm {pagination.limit} anime
          </Button>
        </div>
      ) : null}
    </>
  );
}

// Render phân trang desktop (prev/next + số trang) và nút "Tải thêm" trên mobile, nhận pagination object và callback setPage từ page cha.