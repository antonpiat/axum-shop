import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  const items: Array<number | "ellipsis"> = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push("ellipsis");
    items.push(p);
  });

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </Button>
      {items.map((item, i) =>
        item === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-zinc-500">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? "primary" : "ghost"}
            size="sm"
            onClick={() => onPageChange(item)}
          >
            {item}
          </Button>
        ),
      )}
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  );
}
