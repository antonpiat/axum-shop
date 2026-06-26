"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, getCategories, getProducts } from "@/lib/api";
import type { Category, Paginated, Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { ProductFilters, type FilterValues } from "@/components/product-filters";
import { Pagination } from "@/components/pagination";
import { ProductGridSkeleton } from "@/components/product-grid-skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Paginated<Product> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilters, setMobileFilters] = useState(false);

  const page = Number(searchParams.get("page") ?? "1");
  const query = searchParams.get("query") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const minPrice = searchParams.get("min_price") ?? "";
  const maxPrice = searchParams.get("max_price") ?? "";

  const appliedFilters: FilterValues = {
    query,
    category_id: categoryId,
    min_price: minPrice,
    max_price: maxPrice,
  };

  const filterKey = `${query}|${categoryId}|${minPrice}|${maxPrice}`;

  const buildUrl = useCallback((filters: FilterValues, nextPage: number) => {
    const params = new URLSearchParams();
    if (filters.query) params.set("query", filters.query);
    if (filters.category_id) params.set("category_id", filters.category_id);
    if (filters.min_price) params.set("min_price", filters.min_price);
    if (filters.max_price) params.set("max_price", filters.max_price);
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((result) => {
        if (!cancelled) setCategories(result);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProducts({
      query: query || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      min_price: minPrice ? Number(minPrice) : undefined,
      max_price: maxPrice ? Number(maxPrice) : undefined,
      page,
      pageSize: 12,
    })
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof ApiError ? err.message : "Failed to load products");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, categoryId, minPrice, maxPrice, page]);

  const loading = data === null && error === null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Shop</h1>
          <p className="mt-1 text-zinc-500">
            {data ? `${data.total} products` : "Browse our catalog"}
          </p>
        </div>
        <Button
          variant="secondary"
          className="sm:hidden"
          onClick={() => setMobileFilters(true)}
        >
          Filters
        </Button>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <ProductFilters
            key={filterKey}
            categories={categories}
            initialValues={appliedFilters}
            onApply={(values) => router.push(buildUrl(values, 1))}
            onReset={() => router.push("/")}
          />
        </aside>

        <div className="space-y-8">
          {loading ? (
            <ProductGridSkeleton />
          ) : !data || data.items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center">
              <p className="text-lg font-medium text-zinc-300">No products found</p>
              <p className="mt-1 text-sm text-zinc-500">Try adjusting your filters</p>
              <Button variant="secondary" className="mt-4" onClick={() => router.push("/")}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                page={data.page}
                totalPages={data.total_pages}
                onPageChange={(p) => router.push(buildUrl(appliedFilters, p))}
              />
            </>
          )}
        </div>
      </div>

      {mobileFilters && (
        <ProductFilters
          key={`mobile-${filterKey}`}
          mobile
          categories={categories}
          initialValues={appliedFilters}
          onApply={(values) => router.push(buildUrl(values, 1))}
          onReset={() => router.push("/")}
          onClose={() => setMobileFilters(false)}
        />
      )}
    </div>
  );
}

export function CatalogPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}
